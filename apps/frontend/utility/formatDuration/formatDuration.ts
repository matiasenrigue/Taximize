import moment from "moment";

export function formatDuration(duration: number): string {
    const durationObj = moment.duration(duration);
    const hours = Math.floor(durationObj.asHours()).toString();
    const minutes = durationObj.minutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}