import styles from "./Rating.module.css";
import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";

interface RatingProps {
    maxRating?: number;
    rating: number;
}

export const Rating = (props: RatingProps) => {
    const {
        maxRating = 5,
        rating
    } = props;

    return (
        <div className={styles.container}>
            {Array.from({length: maxRating}).map((_, i) => (
                <FontAwesomeIcon
                    key={i}
                    icon={faStar}
                    className={clsx(
                        styles.star,
                        i < rating && styles.star_filled
                    )}
                />
            ))}
        </div>
    );
};