export const ROLES = {
  SUPER_ADMIN: "super_admin",
  OFFICE_ADMIN: "office_admin",
  OFFICE_AGENT: "office_agent",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const OFFICE_FEATURES = [
  "مصعد",
  "جراج",
  "أمان 24/7",
  "حديقة",
  "مسبح",
  "مكيف مركزي",
  "شرفة",
  "إطلالة",
  "قريب من المترو",
  "قريب من السوق",
  "مسجد قريب",
  "موقف سيارات",
  "تكييف سبليت",
  "خزينة",
  "غرفة خادمة",
  "غرفة سائق",
  "مدخل خاص",
  "روف",
] as const;

export const PROPERTY_STATUSES = ["available", "reserved", "sold", "rented", "pending_review"] as const;
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

export const STATUS_OPTIONS: { value: PropertyStatus; labelAr: string; labelEn: string; color: string }[] = [
  { value: "available", labelAr: "متاح", labelEn: "Available", color: "green" },
  { value: "reserved", labelAr: "محجوز", labelEn: "Reserved", color: "yellow" },
  { value: "sold", labelAr: "تم البيع", labelEn: "Sold", color: "red" },
  { value: "rented", labelAr: "تم التأجير", labelEn: "Rented", color: "blue" },
  { value: "pending_review", labelAr: "قيد المراجعة", labelEn: "Pending Review", color: "orange" },
];

export const SADAT_ZONES = [
  { name_ar: "الحي الأول", name_en: "First District" },
  { name_ar: "الحي الثاني", name_en: "Second District" },
  { name_ar: "الحي الثالث", name_en: "Third District" },
  { name_ar: "الحي الرابع", name_en: "Fourth District" },
  { name_ar: "الحي الخامس", name_en: "Fifth District" },
  { name_ar: "الحي السادس", name_en: "Sixth District" },
  { name_ar: "الحي السابع", name_en: "Seventh District" },
  { name_ar: "الحي الثامن", name_en: "Eighth District" },
  { name_ar: "الحي التاسع", name_en: "Ninth District" },
  { name_ar: "الحي العاشر", name_en: "Tenth District" },
  { name_ar: "منطقة الصناعات", name_en: "Industrial Zone" },
  { name_ar: "المنطقة المركزية", name_en: "Central Zone" },
  { name_ar: "شارع الشهداء", name_en: "El Shohada Street" },
  { name_ar: "شارع الجيش", name_en: "El Geish Street" },
] as const;

export const PROPERTY_TYPES = [
  { name_ar: "شقة", name_en: "Apartment" },
  { name_ar: "فيلا", name_en: "Villa" },
  { name_ar: "أرض", name_en: "Land" },
  { name_ar: "محل تجاري", name_en: "Commercial Shop" },
  { name_ar: "مكتب إداري", name_en: "Office" },
  { name_ar: "دوبلكس", name_en: "Duplex" },
  { name_ar: "بنتهاوس", name_en: "Penthouse" },
  { name_ar: "كراج", name_en: "Garage" },
] as const;
