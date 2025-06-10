import styles from "./Rating.module.css";
import clsx from "clsx";

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
                <div
                    key={i}
                    className={clsx(
                        styles.star,
                        i < rating && styles.star_filled
                    )}/>
            ))}
        </div>
    );
};