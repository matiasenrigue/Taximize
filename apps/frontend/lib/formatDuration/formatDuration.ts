import moment from "moment";

interface DurationConfig {
    hours?: boolean;
    minutes?: boolean;
    seconds?: boolean;
}

export function formatDuration(duration: number, config?: DurationConfig): string {
    const {
        hours: showHours = true,
        minutes: showMinutes = true,
        seconds: showSeconds = false,
    } = config ?? {};

    const durationObj = moment.duration(duration);

    const hours = Math.floor(durationObj.asHours()).toString();
    const minutes = durationObj.minutes().toString();
    const seconds = durationObj.seconds().toString();

    let formattedDuration = '';

    if (showHours)
        formattedDuration += hours;

    if (showMinutes)
        formattedDuration += (showHours ? ':' + minutes.padStart(2, '0') : minutes);

    if (showSeconds)
        formattedDuration += (showMinutes ? ':' + seconds.padStart(2, '0') : seconds);

    return formattedDuration;
}