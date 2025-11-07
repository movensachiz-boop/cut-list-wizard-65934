import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";

interface SmartSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
  category: "material" | "edging_type" | "edging_material";
  placeholder?: string;
  className?: string;
}

export function SmartSelect({
  value,
  onValueChange,
  options,
  category,
  placeholder = "Search...",
  className,
}: SmartSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredOptions, setFilteredOptions] = useState<string[]>(options);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const searchWithAI = async () => {
      if (searchQuery.length < 2) {
        setFilteredOptions(options);
        return;
      }

      setIsSearching(true);
      try {
        const { data, error } = await supabase.functions.invoke('smart-search', {
          body: { 
            query: searchQuery, 
            category 
          }
        });

        if (error) throw error;

        if (data?.success && data?.matches) {
          // Combine AI matches with simple string matching for better results
          const lowerQuery = searchQuery.toLowerCase();
          const simpleMatches = options.filter(opt => 
            opt.toLowerCase().includes(lowerQuery)
          );
          
          // Merge AI matches with simple matches, removing duplicates
          const allMatches = [...new Set([...data.matches, ...simpleMatches])];
          setFilteredOptions(allMatches.slice(0, 10));
        } else {
          // Fallback to simple filtering
          const lowerQuery = searchQuery.toLowerCase();
          setFilteredOptions(
            options.filter(opt => opt.toLowerCase().includes(lowerQuery))
          );
        }
      } catch (error) {
        console.error('Smart search error:', error);
        // Fallback to simple filtering
        const lowerQuery = searchQuery.toLowerCase();
        setFilteredOptions(
          options.filter(opt => opt.toLowerCase().includes(lowerQuery))
        );
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchWithAI, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, options, category]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between hover:scale-[1.02] transition-all", className)}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 glass-effect border-2 shadow-xl" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder={placeholder} 
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="border-b-2"
          />
          <CommandList>
            <CommandEmpty>
              <div className="py-6 text-center text-muted-foreground">
                {isSearching ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span>Searching...</span>
                  </div>
                ) : (
                  "No results found."
                )}
              </div>
            </CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => {
                    onValueChange(option);
                    setOpen(false);
                    setSearchQuery("");
                  }}
                  className="hover:bg-primary/10 cursor-pointer transition-colors"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 text-primary",
                      value === option ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{option}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
