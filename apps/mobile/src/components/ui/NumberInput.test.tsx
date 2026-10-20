import { fireEvent, render, screen } from "@testing-library/react-native";
import { useState } from "react";

import { NumberInput } from "./NumberInput";

/** A parent that owns the value, the way the workout store does in the app. */
function Controlled({
  initial,
  onChange,
  decimals,
}: {
  initial: number | null;
  onChange: (v: number | null) => void;
  decimals?: boolean;
}) {
  const [value, setValue] = useState(initial);
  return (
    <NumberInput
      value={value}
      decimals={decimals}
      accessibilityLabel="field"
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

describe("NumberInput", () => {
  it("keeps a half-typed decimal on screen while reporting the number", async () => {
    const onChange = jest.fn();
    await render(<Controlled initial={null} onChange={onChange} />);

    await fireEvent.changeText(screen.getByLabelText("field"), "82.");
    expect(screen.getByLabelText("field")).toHaveDisplayValue("82.");
    expect(onChange).toHaveBeenLastCalledWith(82);

    await fireEvent.changeText(screen.getByLabelText("field"), "82,5");
    expect(onChange).toHaveBeenLastCalledWith(82.5);
  });

  it("reports null when cleared and drops letters", async () => {
    const onChange = jest.fn();
    await render(<Controlled initial={60} onChange={onChange} decimals={false} />);

    await fireEvent.changeText(screen.getByLabelText("field"), "1a2");
    expect(screen.getByLabelText("field")).toHaveDisplayValue("12");

    await fireEvent.changeText(screen.getByLabelText("field"), "");
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("shows a value set from outside, like a set filled from last time", async () => {
    const { rerender } = await render(
      <NumberInput value={null} onChange={jest.fn()} accessibilityLabel="field" />,
    );
    await rerender(<NumberInput value={100} onChange={jest.fn()} accessibilityLabel="field" />);
    expect(screen.getByLabelText("field")).toHaveDisplayValue("100");
  });
});
