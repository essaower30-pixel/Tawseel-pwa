import React from "react";
import {
  Utensils,
  ShoppingBag,
  Pill,
  Leaf,
  CakeSlice,
  Stethoscope,
  Wrench,
  Car,
  Store as StoreIcon,
  Coffee,
  Sparkles,
  Gift,
  Shirt,
  Smartphone,
  BookOpen,
  Scissors,
  Home,
  Flame,
  Tag,
  Percent,
  BadgePercent,
  Zap,
  TrendingUp,
  Beef,
  Fish,
  Croissant,
  Pizza,
  Baby,
  Package,
  Footprints,
  Watch,
  Milk,
  Apple,
  Heart
} from "lucide-react";

interface CategoryIconProps {
  name: string;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = "w-4 h-4" }) => {
  switch (name) {
    case "Flame":
      return <Flame className={className} />;
    case "Tag":
      return <Tag className={className} />;
    case "Percent":
    case "BadgePercent":
      return <Percent className={className} />;
    case "Zap":
      return <Zap className={className} />;
    case "TrendingUp":
      return <TrendingUp className={className} />;
    case "Beef":
      return <Beef className={className} />;
    case "Shirt":
      return <Shirt className={className} />;
    case "Croissant":
      return <Croissant className={className} />;
    case "Fish":
      return <Fish className={className} />;
    case "Pizza":
      return <Pizza className={className} />;
    case "Apple":
      return <Apple className={className} />;
    case "Baby":
      return <Baby className={className} />;
    case "Milk":
      return <Milk className={className} />;
    case "Package":
      return <Package className={className} />;
    case "Footprints":
      return <Footprints className={className} />;
    case "Watch":
      return <Watch className={className} />;
    case "Heart":
      return <Heart className={className} />;
    case "Utensils":
      return <Utensils className={className} />;
    case "ShoppingBag":
      return <ShoppingBag className={className} />;
    case "Pill":
      return <Pill className={className} />;
    case "Leaf":
      return <Leaf className={className} />;
    case "CakeSlice":
      return <CakeSlice className={className} />;
    case "Stethoscope":
      return <Stethoscope className={className} />;
    case "Wrench":
      return <Wrench className={className} />;
    case "Car":
      return <Car className={className} />;
    case "Coffee":
      return <Coffee className={className} />;
    case "Sparkles":
      return <Sparkles className={className} />;
    case "Gift":
      return <Gift className={className} />;
    case "Smartphone":
      return <Smartphone className={className} />;
    case "BookOpen":
      return <BookOpen className={className} />;
    case "Scissors":
      return <Scissors className={className} />;
    case "Home":
      return <Home className={className} />;
    default:
      return <StoreIcon className={className} />;
  }
};

export const AVAILABLE_CATEGORY_ICONS = [
  { id: "Beef", label: "لحوم وملاحم وجزارة 🥩" },
  { id: "Shirt", label: "ألبسة وملابس وأزياء 👕" },
  { id: "Croissant", label: "مخابز وأفران ومعجنات 🥐" },
  { id: "Milk", label: "ألبان وأجبان ومشتقاتها 🥛" },
  { id: "Fish", label: "أسماك ومأكولات بحرية 🐟" },
  { id: "Apple", label: "فواكه وتمور طازجة 🍎" },
  { id: "Pizza", label: "بيتزا وفطائر ومعجنات 🍕" },
  { id: "Baby", label: "مستلزمات أطفال ومواليد 👶" },
  { id: "Footprints", label: "أحذية وحقائب 👟" },
  { id: "Watch", label: "ساعات وإكسسوارات ⌚" },
  { id: "Heart", label: "عناية وجمال ومستحضرات ❤️" },
  { id: "ShoppingBag", label: "سوبرماركت وبقالة وتسوق 🛒" },
  { id: "Utensils", label: "مطاعم ووجبات جاهزة 🍽️" },
  { id: "CakeSlice", label: "حلويات وشوكولا 🍰" },
  { id: "Coffee", label: "مقاهي ومشروبات وبن ☕" },
  { id: "Leaf", label: "خضار وفواكه طازجة 🥬" },
  { id: "Pill", label: "صيدلية وأدوية ومستلزمات 💊" },
  { id: "Stethoscope", label: "صحة وعيادات واستشارات 🩺" },
  { id: "Wrench", label: "صيانة ومهن وورش 🔧" },
  { id: "Car", label: "سيارات وتوصيل وسائقين 🚗" },
  { id: "Gift", label: "هدايا وزهور وتحف 🎁" },
  { id: "Smartphone", label: "إلكترونيات وموبايل وشاشات 📱" },
  { id: "BookOpen", label: "قرطاسية ومكتبات ومطبوعات 📚" },
  { id: "Scissors", label: "صالونات وحلاقة وتجميل ✂️" },
  { id: "Home", label: "منزل ومفروشات وديكور 🏠" },
  { id: "Package", label: "طرود وشحن وتغليف 📦" },
  { id: "Flame", label: "شعلة العروض والتخفيضات 🔥" },
  { id: "Tag", label: "بطاقة أسعار وعروض 🏷️" },
  { id: "Percent", label: "نسبة خصم وتنزيلات ٪" },
  { id: "Sparkles", label: "عروض مميزة وحصرية ✨" },
  { id: "Zap", label: "توصيل سريع وفوري ⚡" },
  { id: "TrendingUp", label: "الأكثر طلباً ورواجاً 📈" }
];
