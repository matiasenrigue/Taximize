import styles from "./page.module.css";
import {Searchbar} from "../../components/Searchbar/Searchbar";
import {Button} from "../../components/Button/Button";

export default function Map() {
    return (
        <div className={styles.page}>
            <div className={styles.map}/>

            <div className={styles.search_container}>
                <Searchbar/>
            </div>


            <div className={styles.button_container}>
                <Button
                    elevated={true}>
                    Start Ride
                </Button>
            </div>
        </div>
    );
}
