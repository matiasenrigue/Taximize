"""
Process NYC Taxi Zone data: Parse WKT, convert EPSG:2263 to WGS84, and create pre-processed JSON

This script:
1. Reads NYC taxi zone CSV with WKT geometry in EPSG:2263 (NAD83 / New York Long Island)
2. Parses WKT polygons using Shapely
3. Converts coordinates from State Plane (feet) to WGS84 (lat/lng) using pyproj
4. Creates pre-processed JSON for efficient point-in-polygon checks in the backend

References:
- EPSG:2263 to WGS84 conversion: https://gis.stackexchange.com/questions/280292/converting-epsg2263-to-wgs84-using-python-pyproj
- Shapely WKT parsing: https://shapely.readthedocs.io/en/stable/reference/shapely.from_wkt.html
- pyproj documentation: https://pyproj4.github.io/pyproj/stable/examples.html
"""

import csv
import json
import os
import sys
from typing import List, Tuple, Dict, Any

# Increase CSV field size limit
csv.field_size_limit(sys.maxsize)

try:
    from shapely.wkt import loads
    from shapely.geometry import Polygon, MultiPolygon, Point
except ImportError:
    print("Error: shapely is required. Install with: pip install shapely")
    sys.exit(1)

try:
    from pyproj import Transformer
except ImportError:
    print("Error: pyproj is required. Install with: pip install pyproj")
    sys.exit(1)


def convert_coordinates_to_wgs84(coords: List[Tuple[float, float]], transformer: Transformer) -> List[List[float]]:
    """
    Convert coordinates from EPSG:2263 (State Plane feet) to WGS84 (lat/lng)
    
    Args:
        coords: List of (x, y) tuples in EPSG:2263
        transformer: pyproj Transformer object
    
    Returns:
        List of [longitude, latitude] pairs
    """
    wgs84_coords = []
    for x, y in coords:
        # Transform from EPSG:2263 to WGS84
        # Note: transformer returns (lon, lat) when always_xy=True
        lon, lat = transformer.transform(x, y)
        wgs84_coords.append([lon, lat])
    return wgs84_coords


def process_polygon(polygon: Polygon, transformer: Transformer) -> Dict[str, Any]:
    """
    Process a single polygon: extract coordinates and convert to WGS84
    
    Args:
        polygon: Shapely Polygon object
        transformer: pyproj Transformer object
    
    Returns:
        Dictionary with exterior ring and holes (if any) in WGS84
    """
    # Get exterior coordinates
    exterior_coords = list(polygon.exterior.coords)
    exterior_wgs84 = convert_coordinates_to_wgs84(exterior_coords, transformer)
    
    result = {"exterior": exterior_wgs84}
    
    # Process holes if any
    if polygon.interiors:
        holes = []
        for interior in polygon.interiors:
            interior_coords = list(interior.coords)
            holes.append(convert_coordinates_to_wgs84(interior_coords, transformer))
        result["holes"] = holes
    
    return result


def parse_and_convert_geometry(wkt: str, transformer: Transformer) -> List[Dict[str, Any]]:
    """
    Parse WKT geometry and convert to WGS84 coordinates
    
    Args:
        wkt: Well-Known Text string
        transformer: pyproj Transformer object
    
    Returns:
        List of polygon dictionaries with WGS84 coordinates
    """
    try:
        # Parse WKT using Shapely
        geometry = loads(wkt)
        
        polygons = []
        
        if isinstance(geometry, Polygon):
            # Single polygon
            polygons.append(process_polygon(geometry, transformer))
        elif isinstance(geometry, MultiPolygon):
            # Multiple polygons
            for polygon in geometry.geoms:
                polygons.append(process_polygon(polygon, transformer))
        else:
            print(f"Warning: Unsupported geometry type: {type(geometry)}")
            return []
        
        return polygons
    except Exception as e:
        print(f"Error parsing WKT: {e}")
        return []


def check_point_in_zone(lat: float, lon: float, zone_polygons: List[Dict[str, Any]]) -> bool:
    """
    Check if a point (lat, lon) is inside any of the zone's polygons
    This is a reference implementation for the backend
    
    Args:
        lat: Latitude
        lon: Longitude
        zone_polygons: List of polygon dictionaries
    
    Returns:
        True if point is inside the zone
    """
    point = Point(lon, lat)  # Note: Shapely uses (x, y) = (lon, lat)
    
    for polygon_data in zone_polygons:
        # Create Shapely polygon from coordinates
        exterior = polygon_data["exterior"]
        holes = polygon_data.get("holes", [])
        
        # Shapely expects coordinates as tuples
        exterior_tuples = [tuple(coord) for coord in exterior]
        holes_tuples = [[(tuple(coord) for coord in hole)] for hole in holes]
        
        polygon = Polygon(exterior_tuples, holes_tuples)
        
        if polygon.contains(point):
            return True
    
    return False


def main():
    """Main processing function"""
    # File paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_file = os.path.join(script_dir, 'zone_coordinates.csv')
    output_file = os.path.join(script_dir, 'zone_coordinates_processed.json')
    
    # Create transformer from EPSG:2263 to WGS84
    # EPSG:2263 uses US survey feet, so preserve_units is handled internally
    # always_xy=True ensures we get (lon, lat) order
    transformer = Transformer.from_crs("EPSG:2263", "EPSG:4326", always_xy=True)
    
    # Process CSV file
    zones = []
    
    print(f"Reading {csv_file}...")
    with open(csv_file, 'r', encoding='utf-8') as file:
        csv_reader = csv.DictReader(file)
        
        for row in csv_reader:
            # Convert numeric fields
            zone_data = {
                'id': int(row['LocationID']),
                'name': row['zone'],
                'borough': row['borough'],
                'centroid': {
                    'lat': float(row['centroid_lat']),
                    'lon': float(row['centroid_lon'])
                }
            }
            
            # Parse and convert geometry
            wkt = row['geometry']
            polygons = parse_and_convert_geometry(wkt, transformer)
            
            if polygons:
                zone_data['polygons'] = polygons
                zones.append(zone_data)
                print(f"Processed zone {zone_data['id']}: {zone_data['name']}")
            else:
                print(f"Warning: Failed to process zone {zone_data['id']}: {zone_data['name']}")
    
    # Write output JSON
    print(f"\nWriting {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as file:
        json.dump(zones, file, indent=2)
    
    print(f"\nSuccessfully processed {len(zones)} zones")
    
    # Test with known coordinates
    print("\nTesting with known locations:")
    test_locations = [
        ("JFK Airport", 40.6396, -73.7828),
        ("Times Square", 40.7580, -73.9855),
        ("Central Park", 40.7829, -73.9654),
        ("Outside NYC", 39.9526, -75.1652)
    ]
    
    for name, lat, lon in test_locations:
        # Find which zone contains this point
        found_zone = None
        for zone in zones:
            if check_point_in_zone(lat, lon, zone['polygons']):
                found_zone = zone['name']
                break
        
        if found_zone:
            print(f"  {name} ({lat}, {lon}) is in zone: {found_zone}")
        else:
            print(f"  {name} ({lat}, {lon}) is not in any NYC taxi zone")


if __name__ == "__main__":
    main()