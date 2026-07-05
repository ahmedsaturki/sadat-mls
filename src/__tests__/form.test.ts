import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useForm } from "@/hooks/useForm";

describe("useForm", () => {
  const defaultOptions = {
    initialValues: { name: "", email: "" },
    onSubmit: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes with initial values", () => {
    const { result } = renderHook(() => useForm(defaultOptions));
    expect(result.current.values).toEqual({ name: "", email: "" });
    expect(result.current.errors).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.isDirty).toBe(false);
  });

  it("updates values on handleChange", () => {
    const { result } = renderHook(() => useForm(defaultOptions));

    act(() => {
      result.current.handleChange("name", "John");
    });

    expect(result.current.values.name).toBe("John");
    expect(result.current.isDirty).toBe(true);
  });

  it("clears field error on change", () => {
    const { result } = renderHook(() =>
      useForm({
        ...defaultOptions,
        validate: (values) => {
          const errors: Partial<Record<string, string>> = {};
          if (!values.name) errors.name = "Required";
          return errors;
        },
      })
    );

    act(() => {
      result.current.setFieldError("name", "Required");
    });

    expect(result.current.errors.name).toBe("Required");

    act(() => {
      result.current.handleChange("name", "John");
    });

    expect(result.current.errors.name).toBeUndefined();
  });

  it("validates on submit", async () => {
    const validate = vi.fn().mockReturnValue({ name: "Required" });
    const onSubmit = vi.fn();
    const { result } = renderHook(() =>
      useForm({
        initialValues: { name: "", email: "" },
        validate,
        onSubmit,
      })
    );

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent);
    });

    expect(validate).toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(result.current.errors.name).toBe("Required");
  });

  it("calls onSubmit when validation passes", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useForm({
        initialValues: { name: "John", email: "john@example.com" },
        validate: () => ({}),
        onSubmit,
      })
    );

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent);
    });

    expect(onSubmit).toHaveBeenCalledWith({
      name: "John",
      email: "john@example.com",
    });
    expect(result.current.isDirty).toBe(false);
  });

  it("resets form to initial values", () => {
    const { result } = renderHook(() => useForm(defaultOptions));

    act(() => {
      result.current.handleChange("name", "John");
    });

    expect(result.current.values.name).toBe("John");

    act(() => {
      result.current.reset();
    });

    expect(result.current.values).toEqual({ name: "", email: "" });
    expect(result.current.isDirty).toBe(false);
  });

  it("sets and clears field errors", () => {
    const { result } = renderHook(() => useForm(defaultOptions));

    act(() => {
      result.current.setFieldError("name", "Required");
    });

    expect(result.current.errors.name).toBe("Required");

    act(() => {
      result.current.clearErrors();
    });

    expect(result.current.errors).toEqual({});
  });

  it("skips validation when no validate function provided", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useForm({
        initialValues: { name: "", email: "" },
        onSubmit,
      })
    );

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent);
    });

    expect(onSubmit).toHaveBeenCalledWith({ name: "", email: "" });
    expect(result.current.errors).toEqual({});
  });

  it("sets field-level errors from onSubmit throw", async () => {
    const onSubmit = vi.fn().mockRejectedValue({ field: "email", message: "Email taken" });
    const { result } = renderHook(() =>
      useForm({
        initialValues: { name: "John", email: "john@example.com" },
        onSubmit,
      })
    );

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent);
    });

    expect(result.current.errors.email).toBe("Email taken");
  });

  it("isSubmitting is false after successful submit completes", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useForm({
        initialValues: { name: "John", email: "" },
        onSubmit,
      })
    );

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent);
    });

    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.isDirty).toBe(false);
  });

  it("does not set isDirty when handleChange sets same value", () => {
    const { result } = renderHook(() =>
      useForm({ initialValues: { name: "John", email: "" }, onSubmit: vi.fn() })
    );

    expect(result.current.isDirty).toBe(false);

    act(() => {
      result.current.handleChange("name", "John");
    });

    expect(result.current.values.name).toBe("John");
    expect(result.current.isDirty).toBe(true);
  });

  it("handles multiple field changes", () => {
    const { result } = renderHook(() => useForm(defaultOptions));

    act(() => {
      result.current.handleChange("name", "John");
    });
    act(() => {
      result.current.handleChange("email", "john@example.com");
    });

    expect(result.current.values).toEqual({ name: "John", email: "john@example.com" });
  });

  it("reset clears errors and dirty state", () => {
    const { result } = renderHook(() => useForm(defaultOptions));

    act(() => {
      result.current.handleChange("name", "John");
      result.current.setFieldError("name", "Error");
    });

    expect(result.current.isDirty).toBe(true);
    expect(result.current.errors.name).toBe("Error");

    act(() => {
      result.current.reset();
    });

    expect(result.current.isDirty).toBe(false);
    expect(result.current.errors).toEqual({});
    expect(result.current.values).toEqual({ name: "", email: "" });
  });
});
