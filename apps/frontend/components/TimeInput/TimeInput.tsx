import styles from "./TimeInput.module.css";
import {ForwardedRef, forwardRef, useEffect, useImperativeHandle, useRef, useState} from "react";
import {moveCursorToEnd, removeAllSelections, selectContent} from "../../lib/selectContent";

interface TimeInputProps {
    onChange?: (value: number) => void; // in milliseconds
    suffix?: string;
}

export const TimeInput = (props: TimeInputProps) => {
    const {
        onChange,
        suffix = "h",
    } = props;
    const hourRef = useRef<SegmentHandle>(null!);
    const minuteRef = useRef<SegmentHandle>(null!);

    const handleClick = (e) => {
        if (e.target !== e.currentTarget)
            return;
        hourRef?.current?.focus();
    }

    const handleChange = () => {
        const hour = hourRef.current.value;
        const minute = minuteRef.current.value;
        const totalInMilliseconds = ((hour * 60) + minute) * 60 * 1000;
        if (onChange)
            onChange(totalInMilliseconds);
    };

    return (
        <div
            className={styles.container}
            data-testid={"time-input"}
            onClick={handleClick}>
            <Segment
                ref={hourRef}
                testId={"segment-hour"}
                defaultValue={0}
                minValue={0}
                maxValue={23}
                onConfirm={() => minuteRef?.current?.focus()}
                onChange={handleChange}/>
            <span className={styles.text}>:</span>
            <Segment
                ref={minuteRef}
                testId={"segment-minute"}
                defaultValue={0}
                minValue={0}
                maxValue={59}
                onConfirm={() => minuteRef?.current?.blur()}
                onChange={handleChange}/>
            <span className={styles.text}>{suffix}</span>
        </div>
    );
};

export type SegmentHandle = {
    focus: () => void;
    blur: () => void;
    value: number;
}

interface SegmentProps {
    defaultValue?: number;
    minValue?: number;
    maxValue?: number;
    onChange?: (value: number) => void;
    onConfirm?: () => void;
    onBlur?: () => void;
    testId?: string | undefined;
}

const Segment = forwardRef<SegmentHandle>((props: SegmentProps, ref: ForwardedRef<any>) => {
    const {
        defaultValue = 0,
        minValue = 0,
        maxValue = 99,
        onChange,
        onConfirm,
        onBlur,
        testId,
    } = props;

    const elementRef = useRef<HTMLSpanElement>(null!);
    const [value, setValue] = useState(defaultValue);

    const focus = () => elementRef.current.focus();
    const blur = () => elementRef.current.blur();

    const handleInput = (e) => {
        let newValue = parseInt(e.target.textContent) || 0;
        newValue = Math.max(Math.min(newValue, maxValue), minValue);
        e.target.textContent = newValue.toLocaleString([], {minimumIntegerDigits: 2});
        moveCursorToEnd(e.target);
        setValue(newValue);
        if (newValue.toString().length === maxValue.toString().length)
            if (onConfirm) onConfirm();
    };

    const handleKeyDown = (e) => {
        if (isNaN(e.key) && e.key.length === 1)
            e.preventDefault();
        if (["Enter", ":", " "].includes(e.key))
            if (onConfirm) onConfirm();
    };

    useImperativeHandle(ref, () => ({
        focus,
        blur,
        value
    }));

    useEffect(() => {
        if (onChange) onChange(value);
    }, [value]);

    return (
        <span
            className={styles.segment}
            ref={elementRef}
            role={"spinbutton"}
            aria-valuemin={minValue}
            aria-valuemax={maxValue}
            aria-valuenow={value}
            aria-valuetext={value.toString()}
            aria-label={"Hour"}
            inputMode={"numeric"}
            contentEditable={true}
            suppressContentEditableWarning={true}
            spellCheck={false}
            autoCorrect={"off"}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={(e) => selectContent(e.target)}
            onBlur={() => {
                removeAllSelections();
                if (onBlur) onBlur();
            }}
            data-testid={testId}>
            {defaultValue.toLocaleString([], {minimumIntegerDigits: 2})}
        </span>
    )
});