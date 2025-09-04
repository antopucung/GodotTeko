import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Grid3X3, ChevronDown, ArrowUpDown } from "lucide-react";

interface CategoryHeroProps {
  title: string;
  description: string;
  count: number;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  selectedFormat: string;
  onFormatChange: (format: string) => void;
  selectedSort: string;
  onSortChange: (sort: string) => void;
}

const filterTags = [
  "All products",
  "AI",
  "Animated",
  "Business",
  "Characters",
  "Crypto",
  "Ecommerce",
  "Education",
  "Finance",
  "Gaming",
  "Healthcare",
  "Icons",
  "Illustrations",
  "Marketing",
  "Mobile",
  "Nature",
  "Photography",
  "Social",
  "Travel",
  "Web"
];

const formatOptions = [
  { name: "Any format", icon: "🎨" },
  { name: "Figma", icon: "🎨", color: "#F24E1E" },
  { name: "PowerPoint", icon: "📊", color: "#D04423" },
  { name: "3D Studio Max", icon: "🎯", color: "#1BA1E2" },
  { name: "Illustrator", icon: "🎨", color: "#FF9A00" },
  { name: "Sketch", icon: "💎", color: "#FDB300" },
  { name: "After Effects", icon: "🎬", color: "#9999FF" },
  { name: "Lunacy", icon: "🌙", color: "#1A73E8" },
  { name: "XD", icon: "🎯", color: "#FF61F6" },
  { name: "Blender", icon: "🎨", color: "#F5792A" },
  { name: "Maya", icon: "🎯", color: "#37A5CC" },
  { name: "Cinema 4D", icon: "🎬", color: "#011A6A" },
  { name: "Photoshop", icon: "🖼️", color: "#31A8FF" }
];

const sortOptions = [
  "Release date",
  "Popularity",
  "Highest price",
  "Lowest price",
  "Featured"
];

export default function CategoryHero({
  title,
  description,
  count,
  activeFilter,
  onFilterChange,
  selectedFormat,
  onFormatChange,
  selectedSort,
  onSortChange
}: CategoryHeroProps) {
  return (
    <section className="relative bg-[#161717] overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
        style={{
          backgroundImage: "url('https://ext.same-assets.com/1519585551/829538091.jpeg')"
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          {/* Category Title */}
          <h1 className="text-4xl lg:text-5xl font-medium text-white mb-4">
            {title}
          </h1>

          {/* Description */}
          <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
            {description}
          </p>
        </div>
      </div>

      {/* Filter Tags */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="flex items-center justify-between mb-4">
          {/* Tags */}
          <div className="flex overflow-x-auto space-x-2 pb-2 scrollbar-hide flex-1 mr-4">
            {filterTags.map((tag) => (
              <Button
                key={tag}
                onClick={() => onFilterChange(tag)}
                className={`whitespace-nowrap px-6 py-2 rounded-full font-medium text-sm transition-all flex-shrink-0 ${
                  activeFilter === tag
                    ? "bg-[#3b51bf] hover:bg-[#3b51bf]/90 text-white"
                    : "bg-transparent hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-600/30 hover:border-gray-500"
                }`}
              >
                {tag}
              </Button>
            ))}
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-transparent border-gray-600/30 text-gray-400 hover:text-white hover:bg-gray-800 hover:border-gray-500 rounded-full px-4 py-2 text-sm font-medium flex items-center space-x-2"
                >
                  <ArrowUpDown className="h-4 w-4" />
                  <span>{selectedSort}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-[#1a1a1a] border-gray-700 mt-2">
                {sortOptions.map((option) => (
                  <DropdownMenuItem
                    key={option}
                    onClick={() => onSortChange(option)}
                    className={`text-gray-300 hover:text-white hover:bg-gray-800 py-3 cursor-pointer ${
                      selectedSort === option ? "bg-gray-800 text-white" : ""
                    }`}
                  >
                    {option}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Format Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-transparent border-gray-600/30 text-gray-400 hover:text-white hover:bg-gray-800 hover:border-gray-500 rounded-full px-4 py-2 text-sm font-medium flex items-center space-x-2"
                >
                  <Grid3X3 className="h-4 w-4" />
                  <span>Format</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80 bg-[#1a1a1a] border-gray-700 mt-2 p-4">
                <div className="grid grid-cols-2 gap-3">
                  {formatOptions.map((format) => (
                    <DropdownMenuItem
                      key={format.name}
                      onClick={() => onFormatChange(format.name)}
                      className={`text-gray-300 hover:text-white hover:bg-gray-800 py-3 px-3 cursor-pointer rounded-lg flex items-center space-x-3 ${
                        selectedFormat === format.name ? "bg-[#3b51bf] text-white" : ""
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: format.color || "#666" }}
                      >
                        {format.name === "Any format" ? <Grid3X3 className="h-4 w-4" /> : format.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium">{format.name}</span>
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </section>
  );
}
