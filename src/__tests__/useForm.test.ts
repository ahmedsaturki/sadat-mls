import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useForm } from "@/hooks/useForm";

type Sample = {
  email: string;
  password: string;
};

const initial: Sample = { email: "", password: "" };

describe("useForm", () => {
  it("initializes with provided values, !dirty, !submitting", () => {
    const onSubmit = vi.fn(async () => undefined);
    const { result } = renderHook(() =>
      useForm<Sample>({ initialValues: initial, onSubmit }),
    );

    expect(result.current.values).toEqual(initial);
    expect(result.current.errors).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.isDirty).toBe(false);
  });

  it("handleChange updates the value and flips isDirty", () => {
    const onSubmit = vi.fn(async () => undefined);
    const { result } = renderHook(() =>
      useForm<Sample>({ initialValues: initial, onSubmit }),
    );

    act(() => {
      result.current.handleChange("email", "alice@example.com");
    });

    expect(result.current.values.email).toBe("alice@example.com");
    expect(result.current.isDirty).toBe(true);
  });

  it("handleChange clears a field's error when the value changes", () => {
    const onSubmit = vi.fn(async () => undefined);
    const { result } = renderHook(() =>
      useForm<Sample>({ initialValues: initial, onSubmit }),
    );

    act(() => {
      result.current.setFieldError("email", "is bad");
    });
    expect(result.current.errors.email).toBe("is bad");

    act(() => {
      result.current.handleChange("email", "alice@example.com");
    });
    expect(result.current.errors.email).toBeUndefined();
  });

  it("validate blocks onSubmit and seeds errors", async () => {
    const onSubmit = vi.fn(async () => undefined);
    const validate = (v: Sample) =>
      v.email === "" ? { email: "required" } : {};

    const { result } = renderHook(() =>
      useForm<Sample>({ initialValues: initial, validate, onSubmit }),
    );

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent);
    });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(result.current.errors.email).toBe("required");
  });

  it("successful submit resets isDirty", async () => {
    const onSubmit = vi.fn(async () => undefined);

    const { result } = renderHook(() =>
      useForm<Sample>({ initialValues: initial, onSubmit }),
    );

    act(() => result.current.handleChange("email", "x"));
    expect(result.current.isDirty).toBe(true);

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent);
    });

    expect(onSubmit).toHaveBeenCalledWith({
      email: "x",
      password: "",
    });
    expect(result.current.isDirty).toBe(false);
    expect(result.current.isSubmitting).toBe(false);
  });

  it("submit error with `field` shape populates fieldErrors", async () => {
    const onSubmit = vi.fn(async () => {
      throw { field: "email", message: "taken" };
    });

    const { result } = renderHook(() =>
      useForm<Sample>({ initialValues: initial, onSubmit }),
    );

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent);
    });

    expect(result.current.errors.email).toBe("taken");
  });

  it("reset returns to initialValues", () => {
    const onSubmit = vi.fn(async () => undefined);
    const { result } = renderHook(() =>
      useForm<Sample>({ initialValues: initial, onSubmit }),
    );

    act(() => result.current.handleChange("email", "x"));
    act(() => result.current.setFieldError("email", "bad"));

    act(() => {
      result.current.reset();
    });
    expect(result.current.values).toEqual(initial);
    expect(result.current.errors).toEqual({});
    expect(result.current.isDirty).toBe(false);
  });

  it("clearErrors clears all field errors", () => {
    const onSubmit = vi.fn(async () => undefined);
    const { result } = renderHook(() =>
      useForm<Sample>({ initialValues: initial, onSubmit }),
    );

    act(() => {
      result.current.setFieldError("email", "bad");
      result.current.setFieldError("password", "weak");
    });
    act(() => result.current.clearErrors());
    expect(result.current.errors).toEqual({});
  });

  it("handles submit when no validate is provided", async () => {
    const onSubmit = vi.fn(async () => undefined);
    const { result } = renderHook(() =>
      useForm<Sample>({ initialValues: initial, onSubmit }),
    );

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent);
    });

    expect(onSubmit).toHaveBeenCalledWith(initial);
  });
});
