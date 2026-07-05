import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Messages } from "@/i18n/getMessages";

vi.mock("next-intl", () => ({
  useLocale: () => "ar",
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ limit: () => ({ single: () => ({ data: null, error: null }) }) }) }),
    }),
  }),
}));

import PropertyBasicInfo from "@/components/properties/PropertyBasicInfo";
import PropertyFeatures from "@/components/properties/PropertyFeatures";
import PropertyOwnerInfo from "@/components/properties/PropertyOwnerInfo";

const mockDict = {
  common: { add: "Add" },
  property: {
    title: "Title",
    description: "Description",
    type: "Type",
    zone: "Zone",
    street: "Street",
    hasBalcony: "Balcony",
    hasParking: "Parking",
    hasElevator: "Elevator",
  },
  office: {
    selectType: "Select type",
    selectZone: "Select zone",
    propertyOwner: "Property Owner",
    ownerName: "Owner Name",
    ownerPhone: "Owner Phone",
    ownerEmail: "Owner Email",
    ownerNotes: "Notes",
  },
  propertyFeatures: {
    balconyDescription: "Private balcony or terrace",
    parkingDescription: "Covered or open parking space",
    elevatorDescription: "Passenger elevator in building",
    featureEnabled: "Enabled",
    featureDisabled: "Disabled",
    feature: {
      balcony: "Balcony",
      parking: "Parking",
      elevator: "Elevator",
    }
  }
} as unknown as Messages;

describe("PropertyBasicInfo", () => {
  const defaultProps = {
    locale: "en" as const,
    dict: mockDict,
    formData: { title: "", description: "", property_type_id: "", zone_id: "", street: "" },
    zones: [],
    types: [],
    errors: {},
    onChange: () => {},
  };

  it("renders all input fields with labels", () => {
    render(<PropertyBasicInfo {...defaultProps} />);
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(screen.getByLabelText("Type")).toBeInTheDocument();
    expect(screen.getByLabelText("Zone")).toBeInTheDocument();
    expect(screen.getByLabelText("Street")).toBeInTheDocument();
  });

  it("renders error messages when provided", () => {
    const errors = { title: "Title is required", street: "Street is required" };
    render(<PropertyBasicInfo {...defaultProps} errors={errors} />);
    expect(screen.getByText("Title is required")).toBeInTheDocument();
    expect(screen.getByText("Street is required")).toBeInTheDocument();
  });

  it("renders zone and type options with English labels when locale=en", () => {
    const zones = [{ id: "1", name_ar: "الزايدين", name_en: "El Zaydin" }];
    const types = [{ id: "1", name_ar: "شقة", name_en: "Apartment" }];
    render(<PropertyBasicInfo {...defaultProps} zones={zones} types={types} />);
    expect(screen.getByText("El Zaydin")).toBeInTheDocument();
    expect(screen.getByText("Apartment")).toBeInTheDocument();
  });

  it("renders zone and type options with Arabic labels when locale=ar", () => {
    const zones = [{ id: "1", name_ar: "الزايدين", name_en: "El Zaydin" }];
    const types = [{ id: "1", name_ar: "شقة", name_en: "Apartment" }];
    render(<PropertyBasicInfo {...defaultProps} locale="ar" zones={zones} types={types} />);
    expect(screen.getByText("الزايدين")).toBeInTheDocument();
    expect(screen.getByText("شقة")).toBeInTheDocument();
  });
});

describe("PropertyFeatures", () => {
  const defaultProps = {
    dict: mockDict,
    formData: { balcony: false, parking: false, elevator: false },
    onChange: () => {},
  };

  it("renders all three feature checkboxes", () => {
    render(<PropertyFeatures {...defaultProps} />);
    expect(screen.getByText("Balcony")).toBeInTheDocument();
    expect(screen.getByText("Parking")).toBeInTheDocument();
    expect(screen.getByText("Elevator")).toBeInTheDocument();
  });

  it("renders three checkbox inputs", () => {
    render(<PropertyFeatures {...defaultProps} />);
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(3);
  });
});

describe("PropertyOwnerInfo", () => {
  const defaultProps = {
    dict: mockDict,
    locale: "en" as const,
    owners: [
      { owner_name: "", owner_phone: "", owner_email: "", notes: "" },
    ],
    onChange: () => {},
    onAdd: () => {},
    onRemove: () => {},
  };

  it("renders all four owner info inputs with aria-labels", () => {
    render(<PropertyOwnerInfo {...defaultProps} />);
    expect(screen.getByLabelText("Owner Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Owner Phone")).toBeInTheDocument();
    expect(screen.getByLabelText("Owner Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Notes")).toBeInTheDocument();
  });

  it("renders property owner heading", () => {
    render(<PropertyOwnerInfo {...defaultProps} />);
    expect(screen.getByText("Property Owner")).toBeInTheDocument();
  });

  it("renders add owner button", () => {
    render(<PropertyOwnerInfo {...defaultProps} />);
    expect(screen.getByRole("button", { name: /Add/i })).toBeInTheDocument();
  });

  it("renders multiple owners when provided", () => {
    const owners = [
      { owner_name: "Ahmed", owner_phone: "01012345678", owner_email: "", notes: "" },
      { owner_name: "Sara", owner_phone: "01098765432", owner_email: "", notes: "" },
    ];
    render(<PropertyOwnerInfo {...defaultProps} owners={owners} />);
    expect(screen.getByDisplayValue("Ahmed")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Sara")).toBeInTheDocument();
  });
});
