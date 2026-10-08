/**
 * The blanks Townies embroids on, with ONLY the colourways the makers actually
 * sell (Lucas, 10-07: "we primarily work with Weld, Richardson or Yupoong;
 * anything those guys provide we could do"). GENERATED from research of the
 * makers' own sites on 2026-10-07 (scratch blanks-research.json); hex values
 * are approximations of the real fabric, which is why the builder says so.
 * Regenerate or hand-edit here; nothing else in the builder needs to change.
 */
export type Colorway = { name: string; front: string; back: string; brim: string };
export type BlankModel = {
  id: string;
  brand: 'Weld' | 'Richardson' | 'Yupoong';
  model: string;
  name: string;
  short: string;
  /** Drawing profile: 'everyday' squashes the crown lower. */
  profile: 'lifestyle' | 'everyday';
  /** Rear panels are trucker mesh. */
  mesh: boolean;
  url: string;
  colorways: Colorway[];
};

export const BLANK_BRANDS = ['Weld', 'Richardson', 'Yupoong'] as const;

export const BLANKS: BlankModel[] = [
  {
    "id": "two-tone-workhorse",
    "brand": "Weld",
    "model": "Two Tone Workhorse",
    "name": "Two Tone Workhorse Hat",
    "short": "Two-tone 5-panel. Slightly structured, pre-curved brim, brushed cotton twill. The blank on most Townies town hats.",
    "profile": "lifestyle",
    "mesh": false,
    "url": "https://weldmfg.co/products/two-tone-brushed-cotton-workhorse-snapback-hat",
    "colorways": [
      {
        "name": "Java - Brushed",
        "front": "#EEE7D6",
        "back": "#EEE7D6",
        "brim": "#5A3723"
      },
      {
        "name": "Black - Brushed",
        "front": "#EEE7D6",
        "back": "#EEE7D6",
        "brim": "#232023"
      },
      {
        "name": "Cactus - Brushed",
        "front": "#EEE7D6",
        "back": "#EEE7D6",
        "brim": "#7D6A3C"
      },
      {
        "name": "Rust - Brushed",
        "front": "#EEE7D6",
        "back": "#EEE7D6",
        "brim": "#9A4428"
      },
      {
        "name": "Slate Blue - Brushed",
        "front": "#EEE7D6",
        "back": "#EEE7D6",
        "brim": "#7C87A8"
      },
      {
        "name": "Cactus Dune - Brushed",
        "front": "#7D6A3C",
        "back": "#7D6A3C",
        "brim": "#C19072"
      },
      {
        "name": "Dune Black - Brushed",
        "front": "#C19072",
        "back": "#C19072",
        "brim": "#232023"
      },
      {
        "name": "Hunter-Navy - Brushed",
        "front": "#405238",
        "back": "#405238",
        "brim": "#2A2836"
      },
      {
        "name": "Navy - Brushed",
        "front": "#EEE7D6",
        "back": "#EEE7D6",
        "brim": "#2A2836"
      },
      {
        "name": "Hunter - Brushed",
        "front": "#EEE7D6",
        "back": "#EEE7D6",
        "brim": "#405238"
      },
      {
        "name": "Sun - Brushed",
        "front": "#EEE7D6",
        "back": "#EEE7D6",
        "brim": "#EFB718"
      },
      {
        "name": "Jam - Brushed",
        "front": "#EEE7D6",
        "back": "#EEE7D6",
        "brim": "#912A2D"
      },
      {
        "name": "Canyon - Brushed",
        "front": "#EEE7D6",
        "back": "#EEE7D6",
        "brim": "#C08F44"
      },
      {
        "name": "Pompeii - Brushed",
        "front": "#EEE7D6",
        "back": "#EEE7D6",
        "brim": "#A31F16"
      },
      {
        "name": "Moonstone - Brushed",
        "front": "#EEE7D6",
        "back": "#EEE7D6",
        "brim": "#A99CD9"
      }
    ]
  },
  {
    "id": "workhorse",
    "brand": "Weld",
    "model": "Brushed Cotton Workhorse",
    "name": "Brushed Cotton Workhorse Hat",
    "short": "Solid 5-panel. Slightly structured, mid profile, pre-curved brim, brushed cotton.",
    "profile": "lifestyle",
    "mesh": false,
    "url": "https://weldmfg.co/products/brushed-cotton-workhorse-hat%E2%84%A2",
    "colorways": [
      {
        "name": "Dune - Brushed",
        "front": "#C19072",
        "back": "#C19072",
        "brim": "#C19072"
      },
      {
        "name": "Slate Blue - Brushed",
        "front": "#7C87A8",
        "back": "#7C87A8",
        "brim": "#7C87A8"
      },
      {
        "name": "Black - Brushed",
        "front": "#232023",
        "back": "#232023",
        "brim": "#232023"
      },
      {
        "name": "Cactus - Brushed",
        "front": "#7D6A3C",
        "back": "#7D6A3C",
        "brim": "#7D6A3C"
      },
      {
        "name": "Eggshell - Brushed",
        "front": "#EEE7D6",
        "back": "#EEE7D6",
        "brim": "#EEE7D6"
      },
      {
        "name": "Hunter - Brushed",
        "front": "#405238",
        "back": "#405238",
        "brim": "#405238"
      },
      {
        "name": "Navy - Brushed",
        "front": "#2A2836",
        "back": "#2A2836",
        "brim": "#2A2836"
      },
      {
        "name": "Rust - Brushed",
        "front": "#9A4428",
        "back": "#9A4428",
        "brim": "#9A4428"
      }
    ]
  },
  {
    "id": "field-trip",
    "brand": "Weld",
    "model": "Brushed Cotton Field Trip Snapback",
    "name": "Brushed Cotton Field Trip Snapback Hat",
    "short": "Solid 5-panel. Slightly structured, brim arrives flat (curves if you want), brushed cotton.",
    "profile": "lifestyle",
    "mesh": false,
    "url": "https://weldmfg.co/products/brushed-cotton-5-panel-field-trip-snapback",
    "colorways": [
      {
        "name": "Cactus - Brushed",
        "front": "#7D6A3C",
        "back": "#7D6A3C",
        "brim": "#7D6A3C"
      },
      {
        "name": "Black - Brushed",
        "front": "#232023",
        "back": "#232023",
        "brim": "#232023"
      },
      {
        "name": "Eggshell - Brushed",
        "front": "#EEE7D6",
        "back": "#EEE7D6",
        "brim": "#EEE7D6"
      },
      {
        "name": "Java - Brushed",
        "front": "#5A3723",
        "back": "#5A3723",
        "brim": "#5A3723"
      },
      {
        "name": "Navy - Brushed",
        "front": "#2A2836",
        "back": "#2A2836",
        "brim": "#2A2836"
      },
      {
        "name": "Rust - Brushed",
        "front": "#9A4428",
        "back": "#9A4428",
        "brim": "#9A4428"
      },
      {
        "name": "Heavy Seas - Brushed",
        "front": "#4C7079",
        "back": "#4C7079",
        "brim": "#4C7079"
      },
      {
        "name": "Jam - Brushed",
        "front": "#912A2D",
        "back": "#912A2D",
        "brim": "#912A2D"
      },
      {
        "name": "Sun - Brushed",
        "front": "#EFB718",
        "back": "#EFB718",
        "brim": "#EFB718"
      },
      {
        "name": "Moonstone - Brushed",
        "front": "#A99CD9",
        "back": "#A99CD9",
        "brim": "#A99CD9"
      },
      {
        "name": "Slate Blue - Brushed",
        "front": "#7C87A8",
        "back": "#7C87A8",
        "brim": "#7C87A8"
      },
      {
        "name": "Pompeii - Brushed",
        "front": "#A31F16",
        "back": "#A31F16",
        "brim": "#A31F16"
      },
      {
        "name": "Wolf - Brushed",
        "front": "#8C8D88",
        "back": "#8C8D88",
        "brim": "#8C8D88"
      },
      {
        "name": "Canyon - Brushed",
        "front": "#C08F44",
        "back": "#C08F44",
        "brim": "#C08F44"
      }
    ]
  },
  {
    "id": "rope-trucker",
    "brand": "Weld",
    "model": "Brushed Cotton Rope Trucker",
    "name": "Brushed Cotton Rope Trucker Hat",
    "short": "5-panel trucker. Brushed cotton front, tonal mesh back, rope across the brim.",
    "profile": "lifestyle",
    "mesh": true,
    "url": "https://weldmfg.co/products/brushed-cotton-trucker-hat",
    "colorways": [
      {
        "name": "Rust - Brushed",
        "front": "#9A4428",
        "back": "#9A4428",
        "brim": "#9A4428"
      },
      {
        "name": "Cactus - Brushed",
        "front": "#7D6A3C",
        "back": "#7D6A3C",
        "brim": "#7D6A3C"
      },
      {
        "name": "Black - Brushed",
        "front": "#232023",
        "back": "#232023",
        "brim": "#232023"
      },
      {
        "name": "Eggshell - Brushed",
        "front": "#EEE7D6",
        "back": "#EEE7D6",
        "brim": "#EEE7D6"
      },
      {
        "name": "Navy - Brushed",
        "front": "#2A2836",
        "back": "#2A2836",
        "brim": "#2A2836"
      },
      {
        "name": "Hunter - Brushed",
        "front": "#405238",
        "back": "#405238",
        "brim": "#405238"
      },
      {
        "name": "Java - Brushed",
        "front": "#5A3723",
        "back": "#5A3723",
        "brim": "#5A3723"
      },
      {
        "name": "Slate Blue - Brushed",
        "front": "#7C87A8",
        "back": "#7C87A8",
        "brim": "#7C87A8"
      }
    ]
  },
  {
    "id": "r112",
    "brand": "Richardson",
    "model": "112",
    "name": "112 Trucker Hat",
    "short": "The classic trucker. 6-panel, structured, mid profile, pre-curved bill, mesh back.",
    "profile": "lifestyle",
    "mesh": true,
    "url": "https://richardsonsports.com/product/112-trucker-hat",
    "colorways": [
      {
        "name": "Amber Gold",
        "front": "#C19652",
        "back": "#7A5E36",
        "brim": "#C19652"
      },
      {
        "name": "Black",
        "front": "#171717",
        "back": "#171717",
        "brim": "#171717"
      },
      {
        "name": "Charcoal",
        "front": "#635F5E",
        "back": "#635F5E",
        "brim": "#635F5E"
      },
      {
        "name": "Coffee",
        "front": "#201C13",
        "back": "#201C13",
        "brim": "#201C13"
      },
      {
        "name": "Columbia Blue",
        "front": "#7BA6C8",
        "back": "#62A5D2",
        "brim": "#7BA6C8"
      },
      {
        "name": "Cream",
        "front": "#FFF8EE",
        "back": "#F5EDD6",
        "brim": "#FFF8EE"
      },
      {
        "name": "Dark Green",
        "front": "#1F473F",
        "back": "#1F473F",
        "brim": "#1F473F"
      },
      {
        "name": "Kelly",
        "front": "#286D2A",
        "back": "#286D2A",
        "brim": "#286D2A"
      },
      {
        "name": "Light Blue",
        "front": "#1E3F5E",
        "back": "#1E3F5E",
        "brim": "#1E3F5E"
      },
      {
        "name": "Light Grey",
        "front": "#C7C7C7",
        "back": "#A8A8A8",
        "brim": "#C7C7C7"
      },
      {
        "name": "Loden",
        "front": "#7A7D68",
        "back": "#4F4C39",
        "brim": "#7A7D68"
      },
      {
        "name": "Maroon",
        "front": "#4E252B",
        "back": "#4E252B",
        "brim": "#4E252B"
      },
      {
        "name": "Navy",
        "front": "#10182B",
        "back": "#10182B",
        "brim": "#10182B"
      },
      {
        "name": "Orange",
        "front": "#DB4D09",
        "back": "#DB4D09",
        "brim": "#DB4D09"
      },
      {
        "name": "Quarry",
        "front": "#C9D5D1",
        "back": "#C9D5D1",
        "brim": "#C9D5D1"
      },
      {
        "name": "Red",
        "front": "#B32D2A",
        "back": "#B32D2A",
        "brim": "#B32D2A"
      },
      {
        "name": "Royal",
        "front": "#154B89",
        "back": "#154B89",
        "brim": "#154B89"
      },
      {
        "name": "Smoke Blue",
        "front": "#718F8D",
        "back": "#718F8D",
        "brim": "#718F8D"
      },
      {
        "name": "White",
        "front": "#F6F6F6",
        "back": "#F6F6F6",
        "brim": "#F6F6F6"
      },
      {
        "name": "Biscuit/True Blue",
        "front": "#A88543",
        "back": "#183C69",
        "brim": "#A88543"
      },
      {
        "name": "Black/Charcoal",
        "front": "#171717",
        "back": "#635F5E",
        "brim": "#171717"
      },
      {
        "name": "Black/Gold",
        "front": "#171717",
        "back": "#F7C12D",
        "brim": "#171717"
      },
      {
        "name": "Black/Vegas Gold",
        "front": "#171717",
        "back": "#ECCD7D",
        "brim": "#171717"
      },
      {
        "name": "Black/White",
        "front": "#171717",
        "back": "#F6F6F6",
        "brim": "#171717"
      },
      {
        "name": "Brown/Dk Khaki",
        "front": "#423525",
        "back": "#C6BA94",
        "brim": "#423525"
      },
      {
        "name": "Caramel/Black",
        "front": "#8F5118",
        "back": "#171717",
        "brim": "#8F5118"
      },
      {
        "name": "Cardinal/Black",
        "front": "#902829",
        "back": "#171717",
        "brim": "#902829"
      },
      {
        "name": "Cardinal/White",
        "front": "#902829",
        "back": "#F6F6F6",
        "brim": "#902829"
      },
      {
        "name": "Charcoal/Black",
        "front": "#635F5E",
        "back": "#171717",
        "brim": "#635F5E"
      },
      {
        "name": "Charcoal/Columbia Blue",
        "front": "#635F5E",
        "back": "#62A5D2",
        "brim": "#635F5E"
      },
      {
        "name": "Charcoal/Kelly",
        "front": "#635F5E",
        "back": "#286D2A",
        "brim": "#635F5E"
      },
      {
        "name": "Charcoal/Navy",
        "front": "#635F5E",
        "back": "#10182B",
        "brim": "#635F5E"
      },
      {
        "name": "Charcoal/Neon Blue",
        "front": "#635F5E",
        "back": "#019ECB",
        "brim": "#635F5E"
      },
      {
        "name": "Charcoal/Neon Green",
        "front": "#635F5E",
        "back": "#60B744",
        "brim": "#635F5E"
      },
      {
        "name": "Charcoal/Neon Orange",
        "front": "#635F5E",
        "back": "#FB591F",
        "brim": "#635F5E"
      },
      {
        "name": "Charcoal/Neon Pink",
        "front": "#635F5E",
        "back": "#F88EFD",
        "brim": "#635F5E"
      },
      {
        "name": "Charcoal/Neon Yellow",
        "front": "#635F5E",
        "back": "#D3FD36",
        "brim": "#635F5E"
      },
      {
        "name": "Charcoal/Orange",
        "front": "#635F5E",
        "back": "#DB4D09",
        "brim": "#635F5E"
      },
      {
        "name": "Charcoal/Red",
        "front": "#635F5E",
        "back": "#B32D2A",
        "brim": "#635F5E"
      },
      {
        "name": "Charcoal/Royal",
        "front": "#635F5E",
        "back": "#154B89",
        "brim": "#635F5E"
      },
      {
        "name": "Charcoal/White",
        "front": "#635F5E",
        "back": "#F6F6F6",
        "brim": "#635F5E"
      },
      {
        "name": "Chocolate Chip/Birch",
        "front": "#645947",
        "back": "#F3E6C3",
        "brim": "#645947"
      },
      {
        "name": "Columbia Blue/White",
        "front": "#7BA6C8",
        "back": "#F6F6F6",
        "brim": "#7BA6C8"
      },
      {
        "name": "Cyan/White",
        "front": "#028ECB",
        "back": "#F6F6F6",
        "brim": "#028ECB"
      },
      {
        "name": "Dark Green/White",
        "front": "#1F473F",
        "back": "#F6F6F6",
        "brim": "#1F473F"
      },
      {
        "name": "Heather Grey/Black (Split)",
        "front": "#7F8384",
        "back": "#171717",
        "brim": "#7F8384"
      },
      {
        "name": "Heather Grey/Dark Green",
        "front": "#7F8384",
        "back": "#1F473F",
        "brim": "#7F8384"
      },
      {
        "name": "Heather Grey/Light Grey",
        "front": "#7F8384",
        "back": "#E3E3E4",
        "brim": "#7F8384"
      },
      {
        "name": "Heather Grey/Navy",
        "front": "#7F8384",
        "back": "#10182B",
        "brim": "#7F8384"
      },
      {
        "name": "Heather Grey/Royal",
        "front": "#7F8384",
        "back": "#154B89",
        "brim": "#7F8384"
      },
      {
        "name": "Heather Grey/White",
        "front": "#7F8384",
        "back": "#F6F6F6",
        "brim": "#7F8384"
      },
      {
        "name": "Hot Pink/Black",
        "front": "#E27496",
        "back": "#171717",
        "brim": "#E27496"
      },
      {
        "name": "Hot Pink/White",
        "front": "#E27496",
        "back": "#F6F6F6",
        "brim": "#E27496"
      },
      {
        "name": "Kelly/White",
        "front": "#286D2A",
        "back": "#F6F6F6",
        "brim": "#286D2A"
      },
      {
        "name": "Khaki/Coffee",
        "front": "#BBA985",
        "back": "#201C13",
        "brim": "#BBA985"
      },
      {
        "name": "Khaki/White",
        "front": "#BBA985",
        "back": "#F6F6F6",
        "brim": "#BBA985"
      },
      {
        "name": "Loden/Black",
        "front": "#7A7D68",
        "back": "#171717",
        "brim": "#7A7D68"
      },
      {
        "name": "Maroon/White",
        "front": "#4E252B",
        "back": "#F6F6F6",
        "brim": "#4E252B"
      },
      {
        "name": "Navy/Caramel",
        "front": "#10182B",
        "back": "#8F5118",
        "brim": "#10182B"
      },
      {
        "name": "Navy/Charcoal",
        "front": "#10182B",
        "back": "#635F5E",
        "brim": "#10182B"
      },
      {
        "name": "Navy/Dk Khaki",
        "front": "#10182B",
        "back": "#C6BA94",
        "brim": "#10182B"
      },
      {
        "name": "Navy/Orange",
        "front": "#10182B",
        "back": "#DB4D09",
        "brim": "#10182B"
      },
      {
        "name": "Navy/White",
        "front": "#10182B",
        "back": "#F6F6F6",
        "brim": "#10182B"
      },
      {
        "name": "Orange/Black",
        "front": "#DB4D09",
        "back": "#171717",
        "brim": "#DB4D09"
      },
      {
        "name": "Orange/White",
        "front": "#DB4D09",
        "back": "#F6F6F6",
        "brim": "#DB4D09"
      },
      {
        "name": "Purple/White",
        "front": "#58327F",
        "back": "#F6F6F6",
        "brim": "#58327F"
      },
      {
        "name": "Red/Black",
        "front": "#B32D2A",
        "back": "#171717",
        "brim": "#B32D2A"
      },
      {
        "name": "Red/White",
        "front": "#B32D2A",
        "back": "#F6F6F6",
        "brim": "#B32D2A"
      },
      {
        "name": "Royal/Black",
        "front": "#154B89",
        "back": "#171717",
        "brim": "#154B89"
      },
      {
        "name": "Royal/White",
        "front": "#154B89",
        "back": "#F6F6F6",
        "brim": "#154B89"
      },
      {
        "name": "Black/Grey",
        "front": "#171717",
        "back": "#171717",
        "brim": "#ADABAC"
      },
      {
        "name": "Brown/Khaki",
        "front": "#423525",
        "back": "#423525",
        "brim": "#BBA985"
      },
      {
        "name": "Gunmetal/Chocolate Chip",
        "front": "#4F5459",
        "back": "#414246",
        "brim": "#524F40"
      },
      {
        "name": "Khaki/Black",
        "front": "#BBA985",
        "back": "#BBA985",
        "brim": "#171717"
      },
      {
        "name": "Khaki/Chocolate Chip",
        "front": "#BBA985",
        "back": "#BBA985",
        "brim": "#524F40"
      },
      {
        "name": "Khaki/Legion Blue",
        "front": "#BBA985",
        "back": "#BBA985",
        "brim": "#326880"
      },
      {
        "name": "Khaki/Loden",
        "front": "#BBA985",
        "back": "#BBA985",
        "brim": "#78866F"
      },
      {
        "name": "Khaki/Navy",
        "front": "#BBA985",
        "back": "#BBA985",
        "brim": "#10182B"
      },
      {
        "name": "Light Blue/Light Grey",
        "front": "#1E3F5E",
        "back": "#1E3F5E",
        "brim": "#C7C7C7"
      },
      {
        "name": "Light Grey/Gunmetal",
        "front": "#C7C7C7",
        "back": "#A8A8A8",
        "brim": "#4F5459"
      },
      {
        "name": "Navy/Khaki",
        "front": "#10182B",
        "back": "#10182B",
        "brim": "#BBA985"
      },
      {
        "name": "White/Black (Combination)",
        "front": "#F6F6F6",
        "back": "#F6F6F6",
        "brim": "#171717"
      },
      {
        "name": "White/Charcoal",
        "front": "#F6F6F6",
        "back": "#F6F6F6",
        "brim": "#635F5E"
      },
      {
        "name": "White/Columbia Blue",
        "front": "#F6F6F6",
        "back": "#F6F6F6",
        "brim": "#7BA6C8"
      },
      {
        "name": "White/Kelly",
        "front": "#F6F6F6",
        "back": "#F6F6F6",
        "brim": "#286D2A"
      },
      {
        "name": "White/Navy (Combination)",
        "front": "#F6F6F6",
        "back": "#F6F6F6",
        "brim": "#10182B"
      },
      {
        "name": "White/Red",
        "front": "#F6F6F6",
        "back": "#F6F6F6",
        "brim": "#B32D2A"
      },
      {
        "name": "White/Royal",
        "front": "#F6F6F6",
        "back": "#F6F6F6",
        "brim": "#154B89"
      },
      {
        "name": "Cream/Coffee",
        "front": "#FFF8EE",
        "back": "#201C13",
        "brim": "#201C13"
      },
      {
        "name": "Cream/Khaki",
        "front": "#FFF8EE",
        "back": "#BBA985",
        "brim": "#BBA985"
      },
      {
        "name": "Cream/Navy",
        "front": "#FFF8EE",
        "back": "#10182B",
        "brim": "#10182B"
      },
      {
        "name": "Dark Loden/Black",
        "front": "#615C49",
        "back": "#171717",
        "brim": "#171717"
      },
      {
        "name": "Heather Grey/Black (Alternate)",
        "front": "#7F8384",
        "back": "#171717",
        "brim": "#171717"
      },
      {
        "name": "White/Black (Alternate)",
        "front": "#F6F6F6",
        "back": "#171717",
        "brim": "#171717"
      },
      {
        "name": "White/Navy (Alternate)",
        "front": "#F6F6F6",
        "back": "#10182B",
        "brim": "#10182B"
      },
      {
        "name": "Black/White/Heather Grey",
        "front": "#171717",
        "back": "#F6F6F6",
        "brim": "#7F8384"
      },
      {
        "name": "Black/White/Red",
        "front": "#171717",
        "back": "#F6F6F6",
        "brim": "#B32D2A"
      },
      {
        "name": "Blue Teal/Birch/Navy",
        "front": "#0090A8",
        "back": "#F3E6C3",
        "brim": "#10182B"
      },
      {
        "name": "Columbia Blue/White/Navy",
        "front": "#7BA6C8",
        "back": "#F6F6F6",
        "brim": "#10182B"
      },
      {
        "name": "Cream/Black/Loden",
        "front": "#FFF8EE",
        "back": "#171717",
        "brim": "#78866F"
      },
      {
        "name": "Cream/Grey Brown/Brown",
        "front": "#FFF8EE",
        "back": "#201C13",
        "brim": "#423525"
      },
      {
        "name": "Cream/Navy/Amber Gold",
        "front": "#FFF8EE",
        "back": "#10182B",
        "brim": "#C19652"
      },
      {
        "name": "Grey/Charcoal/Black",
        "front": "#ADABAC",
        "back": "#635F5E",
        "brim": "#171717"
      },
      {
        "name": "Grey/Charcoal/Navy",
        "front": "#ADABAC",
        "back": "#635F5E",
        "brim": "#10182B"
      },
      {
        "name": "Heather Grey/Birch/Amber Gold",
        "front": "#7F8384",
        "back": "#F3E6C3",
        "brim": "#A78442"
      },
      {
        "name": "Heather Grey/Birch/Army Olive",
        "front": "#7F8384",
        "back": "#F3E6C3",
        "brim": "#46522E"
      },
      {
        "name": "Heather Grey/Cardinal/Navy",
        "front": "#7F8384",
        "back": "#902829",
        "brim": "#10182B"
      },
      {
        "name": "Heather Grey/Charcoal/Dark Orange",
        "front": "#7F8384",
        "back": "#635F5E",
        "brim": "#9B3E13"
      },
      {
        "name": "Heather Grey/Charcoal/Maroon",
        "front": "#7F8384",
        "back": "#635F5E",
        "brim": "#4E252B"
      },
      {
        "name": "Heather Grey/Red/Black",
        "front": "#7F8384",
        "back": "#B32D2A",
        "brim": "#171717"
      },
      {
        "name": "Mink Beige/Charcoal/Amber Gold",
        "front": "#FFE3CB",
        "back": "#635F5E",
        "brim": "#A78442"
      },
      {
        "name": "Navy/White/Heather Grey",
        "front": "#10182B",
        "back": "#F6F6F6",
        "brim": "#7F8384"
      },
      {
        "name": "Navy/White/Red",
        "front": "#10182B",
        "back": "#F6F6F6",
        "brim": "#B32D2A"
      },
      {
        "name": "Orange/White/Black",
        "front": "#DB4D09",
        "back": "#F6F6F6",
        "brim": "#171717"
      },
      {
        "name": "Red/White/Black",
        "front": "#B32D2A",
        "back": "#F6F6F6",
        "brim": "#171717"
      },
      {
        "name": "Red/White/Heather Grey",
        "front": "#B32D2A",
        "back": "#F6F6F6",
        "brim": "#7F8384"
      },
      {
        "name": "Red/White/Navy",
        "front": "#B32D2A",
        "back": "#F6F6F6",
        "brim": "#10182B"
      },
      {
        "name": "Royal/White/Heather Grey",
        "front": "#154B89",
        "back": "#F6F6F6",
        "brim": "#7F8384"
      },
      {
        "name": "Royal/White/Red",
        "front": "#154B89",
        "back": "#F6F6F6",
        "brim": "#B32D2A"
      },
      {
        "name": "White/Aluminum/Black",
        "front": "#F6F6F6",
        "back": "#939594",
        "brim": "#171717"
      },
      {
        "name": "White/Aluminum/Navy",
        "front": "#F6F6F6",
        "back": "#939594",
        "brim": "#10182B"
      },
      {
        "name": "White/Columbia Blue/Yellow",
        "front": "#F6F6F6",
        "back": "#62A5D2",
        "brim": "#FAAC26"
      }
    ]
  },
  {
    "id": "r115",
    "brand": "Richardson",
    "model": "115",
    "name": "115 Low Pro Trucker Hat",
    "short": "Low-profile trucker. 6-panel, structured, pre-curved bill, mesh back.",
    "profile": "everyday",
    "mesh": true,
    "url": "https://richardsonsports.com/product/115-low-pro-trucker-hat",
    "colorways": [
      {
        "name": "Black",
        "front": "#171717",
        "back": "#171717",
        "brim": "#171717"
      },
      {
        "name": "Loden",
        "front": "#7A7D68",
        "back": "#4F4C39",
        "brim": "#7A7D68"
      },
      {
        "name": "Navy",
        "front": "#10182B",
        "back": "#10182B",
        "brim": "#10182B"
      },
      {
        "name": "White",
        "front": "#F6F6F6",
        "back": "#F6F6F6",
        "brim": "#F6F6F6"
      },
      {
        "name": "Aruba Blue/Birch",
        "front": "#A4D2C8",
        "back": "#F3E6C3",
        "brim": "#A4D2C8"
      },
      {
        "name": "Banana/Birch",
        "front": "#F1DF7B",
        "back": "#F3E6C3",
        "brim": "#F1DF7B"
      },
      {
        "name": "Black/Charcoal",
        "front": "#171717",
        "back": "#635F5E",
        "brim": "#171717"
      },
      {
        "name": "Black/Neon Pink",
        "front": "#171717",
        "back": "#F88EFD",
        "brim": "#171717"
      },
      {
        "name": "Black/White",
        "front": "#171717",
        "back": "#F6F6F6",
        "brim": "#171717"
      },
      {
        "name": "Brown/Dk Khaki",
        "front": "#423525",
        "back": "#C6BA94",
        "brim": "#423525"
      },
      {
        "name": "Caramel/Birch",
        "front": "#8F5118",
        "back": "#F3E6C3",
        "brim": "#8F5118"
      },
      {
        "name": "Caramel/Black",
        "front": "#8F5118",
        "back": "#171717",
        "brim": "#8F5118"
      },
      {
        "name": "Charcoal/Black",
        "front": "#635F5E",
        "back": "#171717",
        "brim": "#635F5E"
      },
      {
        "name": "Charcoal/Red",
        "front": "#635F5E",
        "back": "#B32D2A",
        "brim": "#635F5E"
      },
      {
        "name": "Charcoal/White",
        "front": "#635F5E",
        "back": "#F6F6F6",
        "brim": "#635F5E"
      },
      {
        "name": "Chocolate Chip/Birch",
        "front": "#645947",
        "back": "#F3E6C3",
        "brim": "#645947"
      },
      {
        "name": "Chocolate Chip/Grey Brown",
        "front": "#645947",
        "back": "#4F4840",
        "brim": "#645947"
      },
      {
        "name": "Cyan/Black",
        "front": "#028ECB",
        "back": "#171717",
        "brim": "#028ECB"
      },
      {
        "name": "Dark Green Heather/Light Grey",
        "front": "#33524A",
        "back": "#E3E3E4",
        "brim": "#33524A"
      },
      {
        "name": "Dark Loden/Jaffa Orange",
        "front": "#3B2E0F",
        "back": "#BE4112",
        "brim": "#3B2E0F"
      },
      {
        "name": "Heather Grey/Dark Charcoal",
        "front": "#7F8384",
        "back": "#443E3E",
        "brim": "#7F8384"
      },
      {
        "name": "Hot Pink/Black",
        "front": "#E27496",
        "back": "#171717",
        "brim": "#E27496"
      },
      {
        "name": "Lilac/Birch",
        "front": "#B4A4BF",
        "back": "#F3E6C3",
        "brim": "#B4A4BF"
      },
      {
        "name": "Loden/Black",
        "front": "#7A7D68",
        "back": "#171717",
        "brim": "#7A7D68"
      },
      {
        "name": "Navy Heather/Light Grey",
        "front": "#3F4253",
        "back": "#E3E3E4",
        "brim": "#3F4253"
      },
      {
        "name": "Navy/Dk Khaki",
        "front": "#10182B",
        "back": "#E9D6B6",
        "brim": "#10182B"
      },
      {
        "name": "Navy/White",
        "front": "#10182B",
        "back": "#F6F6F6",
        "brim": "#10182B"
      },
      {
        "name": "Patina Green/Birch",
        "front": "#CED79F",
        "back": "#F3E6C3",
        "brim": "#CED79F"
      },
      {
        "name": "Peach/Birch",
        "front": "#F0AB72",
        "back": "#F3E6C3",
        "brim": "#F0AB72"
      },
      {
        "name": "Red Heather/Light Grey",
        "front": "#D42036",
        "back": "#E3E3E4",
        "brim": "#D42036"
      },
      {
        "name": "Red/White",
        "front": "#B32D2A",
        "back": "#F6F6F6",
        "brim": "#B32D2A"
      },
      {
        "name": "Royal Heather/Light Grey",
        "front": "#1A4981",
        "back": "#E3E3E4",
        "brim": "#1A4981"
      },
      {
        "name": "Royal/White",
        "front": "#154B89",
        "back": "#F6F6F6",
        "brim": "#154B89"
      },
      {
        "name": "Smoke Blue/Aluminum",
        "front": "#718F8D",
        "back": "#939594",
        "brim": "#718F8D"
      },
      {
        "name": "Cream/Loden/Dark Orange",
        "front": "#F1E4C1",
        "back": "#4F4C39",
        "brim": "#9B3E13"
      },
      {
        "name": "Dark Orange/Birch/Patriot Blue",
        "front": "#9B3E13",
        "back": "#F3E6C3",
        "brim": "#10182B"
      },
      {
        "name": "Heather Grey/Birch/Amber Gold",
        "front": "#7F8384",
        "back": "#E8D7BB",
        "brim": "#A78442"
      },
      {
        "name": "Heather Grey/Birch/Army Olive",
        "front": "#7F8384",
        "back": "#E8D7BB",
        "brim": "#46522E"
      },
      {
        "name": "Heather Grey/Birch/Cardinal",
        "front": "#7F8384",
        "back": "#E8D7BB",
        "brim": "#902829"
      },
      {
        "name": "Tan/Loden/Brown",
        "front": "#AC9778",
        "back": "#4F4C39",
        "brim": "#423525"
      },
      {
        "name": "White/Blue Hawaiian/Pale Orange",
        "front": "#F6F6F6",
        "back": "#1E98A7",
        "brim": "#E65D33"
      }
    ]
  },
  {
    "id": "r112fp",
    "brand": "Richardson",
    "model": "112FP",
    "name": "112FP Five Panel Trucker Hat",
    "short": "5-panel trucker with a seamless front panel, so the logo has no seam through it.",
    "profile": "lifestyle",
    "mesh": true,
    "url": "https://richardsonsports.com/product/112fp-five-panel-trucker-hat",
    "colorways": [
      {
        "name": "Black",
        "front": "#171717",
        "back": "#171717",
        "brim": "#171717"
      },
      {
        "name": "Navy",
        "front": "#10182B",
        "back": "#10182B",
        "brim": "#10182B"
      },
      {
        "name": "White",
        "front": "#F6F6F6",
        "back": "#F6F6F6",
        "brim": "#F6F6F6"
      },
      {
        "name": "Army Olive/Tan",
        "front": "#46522E",
        "back": "#AC9778",
        "brim": "#46522E"
      },
      {
        "name": "Beetle/Quarry",
        "front": "#51503B",
        "back": "#B5B9A8",
        "brim": "#51503B"
      },
      {
        "name": "Black/White",
        "front": "#171717",
        "back": "#F6F6F6",
        "brim": "#171717"
      },
      {
        "name": "Charcoal/Black",
        "front": "#635F5E",
        "back": "#171717",
        "brim": "#635F5E"
      },
      {
        "name": "Charcoal/White",
        "front": "#635F5E",
        "back": "#F6F6F6",
        "brim": "#635F5E"
      },
      {
        "name": "Chocolate Chip/Birch",
        "front": "#6B5849",
        "back": "#F5EDD6",
        "brim": "#6B5849"
      },
      {
        "name": "Cobalt Blue/Grey",
        "front": "#3172A2",
        "back": "#ADABAC",
        "brim": "#3172A2"
      },
      {
        "name": "Heather Grey/Amber Gold",
        "front": "#7F8384",
        "back": "#A78442",
        "brim": "#7F8384"
      },
      {
        "name": "Heather Grey/Black",
        "front": "#7F8384",
        "back": "#171717",
        "brim": "#7F8384"
      },
      {
        "name": "Khaki/Coffee",
        "front": "#BBA985",
        "back": "#201C13",
        "brim": "#BBA985"
      },
      {
        "name": "Loden/Black",
        "front": "#7A7D68",
        "back": "#171717",
        "brim": "#7A7D68"
      },
      {
        "name": "Navy/White",
        "front": "#10182B",
        "back": "#F6F6F6",
        "brim": "#10182B"
      },
      {
        "name": "Ombre Blue/Navy",
        "front": "#3C3E3D",
        "back": "#0B1121",
        "brim": "#3C3E3D"
      },
      {
        "name": "Pale Khaki/Loden",
        "front": "#898266",
        "back": "#7A7D68",
        "brim": "#898266"
      },
      {
        "name": "Heather Grey/Birch/Army Olive",
        "front": "#7F8384",
        "back": "#F3E6C3",
        "brim": "#46522E"
      }
    ]
  },
  {
    "id": "r258",
    "brand": "Richardson",
    "model": "258",
    "name": "258 5 Panel Classic Rope Hat",
    "short": "5-panel rope cap. Structured, mid profile, pre-curved bill with a contrast rope.",
    "profile": "lifestyle",
    "mesh": false,
    "url": "https://richardsonsports.com/product/258-5-panel-classic-rope-cap",
    "colorways": [
      {
        "name": "Black-White",
        "front": "#171717",
        "back": "#171717",
        "brim": "#171717"
      },
      {
        "name": "Dark Grey-White",
        "front": "#443E3E",
        "back": "#443E3E",
        "brim": "#443E3E"
      },
      {
        "name": "Dark Olive-White",
        "front": "#3D3A27",
        "back": "#3D3A27",
        "brim": "#3D3A27"
      },
      {
        "name": "Kelly-White",
        "front": "#00513B",
        "back": "#00513B",
        "brim": "#00513B"
      },
      {
        "name": "Light Blue-White",
        "front": "#1E3F5E",
        "back": "#1E3F5E",
        "brim": "#1E3F5E"
      },
      {
        "name": "Light Grey-Black",
        "front": "#BDBDBD",
        "back": "#BDBDBD",
        "brim": "#BDBDBD"
      },
      {
        "name": "Light Grey-White",
        "front": "#BDBDBD",
        "back": "#BDBDBD",
        "brim": "#BDBDBD"
      },
      {
        "name": "Navy-White",
        "front": "#10182B",
        "back": "#10182B",
        "brim": "#10182B"
      },
      {
        "name": "Red-White",
        "front": "#9E1E1D",
        "back": "#9E1E1D",
        "brim": "#9E1E1D"
      },
      {
        "name": "Smoke Blue-White",
        "front": "#78A2AE",
        "back": "#78A2AE",
        "brim": "#78A2AE"
      },
      {
        "name": "Soft Blue-Navy",
        "front": "#A7D1DF",
        "back": "#A7D1DF",
        "brim": "#A7D1DF"
      },
      {
        "name": "White-Black",
        "front": "#F6F6F6",
        "back": "#F6F6F6",
        "brim": "#F6F6F6"
      },
      {
        "name": "White-Kelly",
        "front": "#F6F6F6",
        "back": "#F6F6F6",
        "brim": "#F6F6F6"
      },
      {
        "name": "White-Navy",
        "front": "#F6F6F6",
        "back": "#F6F6F6",
        "brim": "#F6F6F6"
      },
      {
        "name": "White-Red",
        "front": "#F6F6F6",
        "back": "#F6F6F6",
        "brim": "#F6F6F6"
      }
    ]
  },
  {
    "id": "y6006",
    "brand": "Yupoong",
    "model": "6006",
    "name": "YP Classics classic trucker cap",
    "short": "Classic 5-panel trucker. High profile, flat bill, mesh back.",
    "profile": "lifestyle",
    "mesh": true,
    "url": "https://www.flexfit.com/hat/classic-trucker",
    "colorways": [
      {
        "name": "Red",
        "front": "#C8102E",
        "back": "#C8102E",
        "brim": "#C8102E"
      },
      {
        "name": "Navy",
        "front": "#1F2A44",
        "back": "#1F2A44",
        "brim": "#1F2A44"
      },
      {
        "name": "Pink",
        "front": "#EE8FB2",
        "back": "#EE8FB2",
        "brim": "#EE8FB2"
      },
      {
        "name": "Black",
        "front": "#1C1C1E",
        "back": "#1C1C1E",
        "brim": "#1C1C1E"
      },
      {
        "name": "White",
        "front": "#F4F4F2",
        "back": "#F4F4F2",
        "brim": "#F4F4F2"
      },
      {
        "name": "Charcoal",
        "front": "#4A4A4D",
        "back": "#4A4A4D",
        "brim": "#4A4A4D"
      }
    ]
  },
  {
    "id": "y6006t",
    "brand": "Yupoong",
    "model": "6006T",
    "name": "YP Classics classic trucker cap - 2-tone",
    "short": "Classic 5-panel trucker in two colours. High profile, flat bill, mesh back.",
    "profile": "lifestyle",
    "mesh": true,
    "url": "https://www.flexfit.com/hat/classic-trucker-2-tone",
    "colorways": [
      {
        "name": "Red / Black",
        "front": "#C8102E",
        "back": "#1C1C1E",
        "brim": "#C8102E"
      },
      {
        "name": "Navy / White",
        "front": "#1F2A44",
        "back": "#F4F4F2",
        "brim": "#1F2A44"
      },
      {
        "name": "Black / White",
        "front": "#1C1C1E",
        "back": "#F4F4F2",
        "brim": "#1C1C1E"
      },
      {
        "name": "Brown / White",
        "front": "#4B3226",
        "back": "#F4F4F2",
        "brim": "#4B3226"
      },
      {
        "name": "Royal / White",
        "front": "#2140A0",
        "back": "#F4F4F2",
        "brim": "#2140A0"
      },
      {
        "name": "Silver / Black",
        "front": "#B5B6B9",
        "back": "#1C1C1E",
        "brim": "#B5B6B9"
      },
      {
        "name": "Heather / Black",
        "front": "#A8A8A6",
        "back": "#1C1C1E",
        "brim": "#A8A8A6"
      },
      {
        "name": "Heather / White",
        "front": "#A8A8A6",
        "back": "#F4F4F2",
        "brim": "#A8A8A6"
      },
      {
        "name": "Charcoal / Black",
        "front": "#4A4A4D",
        "back": "#1C1C1E",
        "brim": "#4A4A4D"
      },
      {
        "name": "Charcoal / White",
        "front": "#4A4A4D",
        "back": "#F4F4F2",
        "brim": "#4A4A4D"
      }
    ]
  },
  {
    "id": "y6006w",
    "brand": "Yupoong",
    "model": "6006W",
    "name": "YP Classics classic trucker cap - white front",
    "short": "Classic 5-panel trucker with a white front. Coloured mesh and visor.",
    "profile": "lifestyle",
    "mesh": true,
    "url": "https://www.flexfit.com/hat/classic-trucker-white-front-panel",
    "colorways": [
      {
        "name": "Red / White / Red",
        "front": "#F4F4F2",
        "back": "#C8102E",
        "brim": "#C8102E"
      },
      {
        "name": "Navy / White / Navy",
        "front": "#F4F4F2",
        "back": "#1F2A44",
        "brim": "#1F2A44"
      },
      {
        "name": "Pink / White / Pink",
        "front": "#F4F4F2",
        "back": "#EE8FB2",
        "brim": "#EE8FB2"
      },
      {
        "name": "Black / White / Black",
        "front": "#F4F4F2",
        "back": "#1C1C1E",
        "brim": "#1C1C1E"
      },
      {
        "name": "Brown / White / Brown",
        "front": "#F4F4F2",
        "back": "#4B3226",
        "brim": "#4B3226"
      },
      {
        "name": "Kelly / White / Kelly",
        "front": "#F4F4F2",
        "back": "#1E7B3A",
        "brim": "#1E7B3A"
      },
      {
        "name": "Royal / White / Royal",
        "front": "#F4F4F2",
        "back": "#2140A0",
        "brim": "#2140A0"
      },
      {
        "name": "C. Blue / White / C. Blue",
        "front": "#F4F4F2",
        "back": "#6CA6D9",
        "brim": "#6CA6D9"
      }
    ]
  },
  {
    "id": "y6089m",
    "brand": "Yupoong",
    "model": "6089M",
    "name": "YP Classics premium snapback cap",
    "short": "Premium 6-panel snapback. Structured, high profile, flat bill, wool blend.",
    "profile": "lifestyle",
    "mesh": false,
    "url": "https://www.flexfit.com/hat/premium-classic-snapback",
    "colorways": [
      {
        "name": "Red",
        "front": "#C8102E",
        "back": "#C8102E",
        "brim": "#C8102E"
      },
      {
        "name": "Navy",
        "front": "#1F2A44",
        "back": "#1F2A44",
        "brim": "#1F2A44"
      },
      {
        "name": "Black",
        "front": "#1C1C1E",
        "back": "#1C1C1E",
        "brim": "#1C1C1E"
      },
      {
        "name": "Royal",
        "front": "#2140A0",
        "back": "#2140A0",
        "brim": "#2140A0"
      },
      {
        "name": "White",
        "front": "#F4F4F2",
        "back": "#F4F4F2",
        "brim": "#F4F4F2"
      },
      {
        "name": "Maroon",
        "front": "#5C1F2B",
        "back": "#5C1F2B",
        "brim": "#5C1F2B"
      },
      {
        "name": "Orange",
        "front": "#F15A22",
        "back": "#F15A22",
        "brim": "#F15A22"
      },
      {
        "name": "Purple",
        "front": "#4B2E83",
        "back": "#4B2E83",
        "brim": "#4B2E83"
      },
      {
        "name": "Silver",
        "front": "#B5B6B9",
        "back": "#B5B6B9",
        "brim": "#B5B6B9"
      },
      {
        "name": "Spruce",
        "front": "#1E3A34",
        "back": "#1E3A34",
        "brim": "#1E3A34"
      },
      {
        "name": "Natural",
        "front": "#EEE8D6",
        "back": "#EEE8D6",
        "brim": "#EEE8D6"
      },
      {
        "name": "Dark Grey",
        "front": "#4E5054",
        "back": "#4E5054",
        "brim": "#4E5054"
      },
      {
        "name": "Dark Navy",
        "front": "#1C2233",
        "back": "#1C2233",
        "brim": "#1C2233"
      },
      {
        "name": "Dark Heather",
        "front": "#5F5F63",
        "back": "#5F5F63",
        "brim": "#5F5F63"
      },
      {
        "name": "Heather Grey",
        "front": "#A8A8A6",
        "back": "#A8A8A6",
        "brim": "#A8A8A6"
      }
    ]
  },
  {
    "id": "y6089mt",
    "brand": "Yupoong",
    "model": "6089MT",
    "name": "YP Classics premium snapback cap - 2-tone",
    "short": "Premium 6-panel snapback with a contrast visor. Flat bill, wool blend.",
    "profile": "lifestyle",
    "mesh": false,
    "url": "https://www.flexfit.com/hat/premium-classic-snapback-2-tone",
    "colorways": [
      {
        "name": "Navy / Red",
        "front": "#1F2A44",
        "back": "#1F2A44",
        "brim": "#C8102E"
      },
      {
        "name": "Black / Red",
        "front": "#1C1C1E",
        "back": "#1C1C1E",
        "brim": "#C8102E"
      },
      {
        "name": "Black / Teal",
        "front": "#1C1C1E",
        "back": "#1C1C1E",
        "brim": "#0096B4"
      },
      {
        "name": "Heather / Red",
        "front": "#A8A8A6",
        "back": "#A8A8A6",
        "brim": "#C8102E"
      },
      {
        "name": "Black / Purple",
        "front": "#1C1C1E",
        "back": "#1C1C1E",
        "brim": "#4B2E83"
      },
      {
        "name": "Black / Silver",
        "front": "#1C1C1E",
        "back": "#1C1C1E",
        "brim": "#B5B6B9"
      },
      {
        "name": "Heather / Navy",
        "front": "#A8A8A6",
        "back": "#A8A8A6",
        "brim": "#1F2A44"
      },
      {
        "name": "Heather / Black",
        "front": "#A8A8A6",
        "back": "#A8A8A6",
        "brim": "#1C1C1E"
      },
      {
        "name": "Heather / Royal",
        "front": "#A8A8A6",
        "back": "#A8A8A6",
        "brim": "#2140A0"
      },
      {
        "name": "Natural / Black",
        "front": "#EEE8D6",
        "back": "#EEE8D6",
        "brim": "#1C1C1E"
      },
      {
        "name": "Heather / Purple",
        "front": "#A8A8A6",
        "back": "#A8A8A6",
        "brim": "#4B2E83"
      },
      {
        "name": "Black / Neon Pink",
        "front": "#1C1C1E",
        "back": "#1C1C1E",
        "brim": "#FF4FA0"
      },
      {
        "name": "Black / Neon Green",
        "front": "#1C1C1E",
        "back": "#1C1C1E",
        "brim": "#D8F51E"
      },
      {
        "name": "Dark Heather / Red",
        "front": "#5F5F63",
        "back": "#5F5F63",
        "brim": "#C8102E"
      },
      {
        "name": "Black / Neon Orange",
        "front": "#1C1C1E",
        "back": "#1C1C1E",
        "brim": "#FF8C1A"
      },
      {
        "name": "Dark Heather / Black",
        "front": "#5F5F63",
        "back": "#5F5F63",
        "brim": "#1C1C1E"
      }
    ]
  },
  {
    "id": "y6502",
    "brand": "Yupoong",
    "model": "6502",
    "name": "YP Classics lightly structured 5-panel snapback cap",
    "short": "Lightly structured 5-panel snapback. Flat bill. The Townies Everyday blank.",
    "profile": "everyday",
    "mesh": false,
    "url": "https://www.flexfit.com/hat/lightly-structured-5-panel",
    "colorways": [
      {
        "name": "Red",
        "front": "#C8102E",
        "back": "#C8102E",
        "brim": "#C8102E"
      },
      {
        "name": "Navy",
        "front": "#1F2A44",
        "back": "#1F2A44",
        "brim": "#1F2A44"
      },
      {
        "name": "Black",
        "front": "#1C1C1E",
        "back": "#1C1C1E",
        "brim": "#1C1C1E"
      },
      {
        "name": "Khaki",
        "front": "#A69676",
        "back": "#A69676",
        "brim": "#A69676"
      },
      {
        "name": "White",
        "front": "#F4F4F2",
        "back": "#F4F4F2",
        "brim": "#F4F4F2"
      },
      {
        "name": "Maroon",
        "front": "#5C1F2B",
        "back": "#5C1F2B",
        "brim": "#5C1F2B"
      },
      {
        "name": "Charcoal",
        "front": "#4A4A4D",
        "back": "#4A4A4D",
        "brim": "#4A4A4D"
      }
    ]
  }
];

export const blankById = (id: string) => BLANKS.find((b) => b.id === id) ?? BLANKS[0];
