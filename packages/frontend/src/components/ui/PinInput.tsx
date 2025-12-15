// src/components/ui/PinInput.tsx
import React, { useRef, useState, useEffect } from "react";

interface PinInputProps {
  length: number;
  onComplete: (pin: string) => void;
}

export const PinInput: React.FC<PinInputProps> = ({ length, onComplete }) => {
  const [pin, setPin] = useState<string[]>(new Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus on the first input field when component mounts
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;

    const newPin = [...pin];
    newPin[index] = element.value;
    setPin(newPin);

    if (element.value !== "" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    const finalPin = newPin.join("");
    if (finalPin.length === length) {
      onComplete(finalPin);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && pin[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").slice(0, length);
    if (!/^\d+$/.test(pasteData)) return;

    const newPin = [...pin];
    for (let i = 0; i < pasteData.length; i++) {
      if (i < length) {
        newPin[i] = pasteData[i];
      }
    }
    setPin(newPin);

    const finalPin = newPin.join("");
    if (finalPin.length === length) {
      onComplete(finalPin);
      inputRefs.current[length - 1]?.focus();
    } else {
      inputRefs.current[finalPin.length]?.focus();
    }
  };

  return (
    <div className="flex justify-center space-x-2" onPaste={handlePaste}>
      {pin.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e.target, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onFocus={(e) => e.target.select()}
          className="w-12 h-12 text-center text-2xl font-semibold border border-input rounded-md focus:ring-2 focus:ring-ring focus:outline-none bg-background"
        />
      ))}
    </div>
  );
};
