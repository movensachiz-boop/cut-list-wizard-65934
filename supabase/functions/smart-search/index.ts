import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MATERIAL_OPTIONS = [
  "White Melamine", "Azzano High Gloss", "Grain colored board", "Grain example board", "Glass 4mm", "Storm grey matt", "Bison",
  "Grigio Matt", "Laricina Melamine", "Storm grey gloss", "Masonite 2.3", "Masonite 2.4", "Hardboard",
  "Postform", "PVC Board 2.4", "Black Board Matt", "Gloss white board", "Postform Large",
  "Caraz", "Luca polenta", "High Gloss melamine", "Plain Colored boards", "Iceberg white-Gloss",
  "Brookhill Matt", "Folkstone Grey Gloss", "Grigio", "Leatherwood", "Lucapolenta", "Lucaurban",
  "Masonite-Large", "PVC (2.4X1.2)", "PVC (2.75X1.83)", "High Gloss", "Superwood", "Congo Matt",
  "MDF Boards", "Shale Oak", "Black Matt", "Washed Shale", "Capuccino Board Matt", "Black Cherry board",
  "Harvard Cherry Board", "Granite", "Folkstone Grey Matt Board", "Calacatta Quartz", "Dunblane Grey Matt Board",
  "Color Board [TBA]", "Natural Oak Matt", "Plywood", "Camden Board Matt", "Cascade Board Matt",
  "Coimbra Board Matt", "Sahara Board Matt", "Quartz Star Gray", "Quartz (Star Range)", "American Walnut",
  "Quartz Slab", "Quartz Stone", "Royal Mahogany", "Calacatta Quartz Slab", "Calais Board",
  "Catalan Postform", "Dunblane gloss board", "Capuccino Gloss", "Petrol Blue",
  // Hardware items
  "Straight hinges ordinary", "192mm Light handles", "Wire nails", "Leg Example Item", "Small plastic brackets",
  "Anchor nails (6X70)", "Runner Example Item", "16mm Screws", "30mm Screws", "40mm Screws", "300mm runners",
  "50mm Screws", "Contact glue 500", "500mm runners", "192mm Heavy  handles", "Hinges corner", "Silicone clear",
  "Postform jointer", "PVC adj legs 150mm sets", "Spice rack pull out", "400mm runners", "Straight hinges soft close",
  "Hanging rail per metre", "Chrome Hanging rail per metre", "500mm PTO runners", "Woodfiller", "Steel corner brackets",
  "Veg baskets 500", "Bin ordinary 25L", "288mm Heavy  handles", "Drawer locks", "Singless Hinges", "450mm runners",
  "Bradnails 50F", "Silicone paintable", "Plastic glass clips", "1 inch nails half", "Black neptune 192",
  "Silicone white", "192mm Black Heavy Handles", "350mm runners", "Drywall screws 41mm", "Metal glass clips",
  "Glass holders plastic", "Shelf studs", "Silicone grey", "Wine rack - 6R", "Wine rack - 9R", "Woodfiller grey",
  "Hinges BIC softclose", "PVC adj legs 100m", "Camlock", "Labour", "Shelf holders", "45mm Screws",
  "Hinges Kitchen Standard", "Nails kg", "Chrome Leg 150mm", "Shelf Stud Item", "Box Anchor Nails (6X70)",
  "Double Action Runners", "Screw 8x16", "Screw 8x30", "Screw 8x40", "Plastic shelf brackets +lids",
  "Hanging Rail + Brackets", "Pull Out Shoe Rack (600mm)", "Metal Corner Brackets", "BIC Hinges",
  "Hinges Blind Corner", "Corner Hinge", "Bar Handles Heavy Steel 128mm", "Bar Handles Heavy Steel 192mm",
  "Cutting fee per sheet", "Anchor nails  8x70", "Hinges Soft Close", "Handle Gold Bar", "Chrome Leg 100mm",
  "Chrome Leg 80mm", "Plastic Legs", "Ball Bearing Drawer Tracks - 500", "Ball Bearing Drawer Tracks - 450",
  "Pull Out Bin", "Veg Basket 500", "Hanger Rail Brackets", "Grooving", "Legs plastics adjustable",
  "Steel brackets", "Edging charge per metre", "Ball Bearing Drawer Tracks - 450 (Soft close)",
  "Ball Bearing Drawer Tracks - 500 (Soft close)", "Rotating Pot Rack", "Corner Hinges Soft Close",
  "Pot Rotating Rack", "Silicone - white", "Cutting - pieces", "Pantry Brackets", "Cups", "Thinners",
  "Filler", "Snow white paint 500", "Spice rack", "Bin - Swing", "Bin Ordinary", "Screw Bits PZ2",
  "Edging (32mm)", "Holesaw", "Desk grommets", "Edging 16mm", "Bar Handles Heavy Steel 288mm",
  "Flash barrel boards", "Handle Roman 224", "Pull out plate rack - 900 unit", "Transport",
  "Aluminium line handles", "Hanging rail ends", "Floating shelf holder", "knob handle", "POS Bits (Box)",
  "Plastic shelf brackets big", "Door catchers", "Timber (76X38)", "Hanging rail - pull out",
  "Sliding Bottom Guide - 3m", "Sliding pulling profile (upright handles)", "Sliding top guide",
  "Sliding U-Channel - 3m", "Sliding wheel set", "Site Visit", "Door knob", "Glass clips plastic",
  "Glass clips metal", "Transport - Outside Gweru", "Screw Big Box 40mm", "Screw Big Box 30mm",
  "Screw Box 16mm", "Screw 8x50", "Forklift hire - local", "Spice pull out", "Silicone - clear",
  "Hinges - BICs", "Tie rack 305", "Trouse rack", "Vegetable rack", "Hanger - Pull Out", "Forklift Hire",
  "Towel rack", "Nails pack", "Hanging Rail", "Cutting fee", "Ball Bearing Drawer Tracks - 500 PTO",
  "Anchor nails  6*70", "Hinge Piano", "Anchor nails  8x100", "Labour, Transport", "Hinges BIC Soft Close",
  "Barrel bolts", "Sliding door fittings", "Sliding doors clips", "Brandering 38X38", "Drywall - 40mm",
  "Glue", "Screw Big Box 50mm", "Flexible corners", "Flutted panels", "Concrete bits",
  "Ball Bearing Drawer Tracks - 400", "Handles - light 198", "Ventilation metal", "Cutting fee half",
  "Tape measure", "Fisher plugs box", "Bar Light Aluminium 192mm", "Hinge fixers", "TNails",
  "Sink full set", "Sealant white", "Silicone - black", "Brandering", "Butt hinge", "Bolts verandah",
  "Ball Bearing Drawer Tracks - 300", "Ball Bearing Drawer Tracks - 350", "Flush hinges", "screws 8*60",
  "Handles -light 96mm", "Handles -light 128mm", "Silicone - Paintable", "Push to Open-Special",
  "1kg 1inch nails", "Glass shelf holder", "Cutting fee clients", "Pvc adjustable legs 1 pack 100mm",
  "Pvc adjustable legs 1 pack 150mm", "Ball Bearing Drawer Tracks - 250", "Padlocks", "Bits star",
  "Bits square", "Glass holders", "Grey paint 1l", "Hinge holes", "Plastic corner brackets",
  "light round 4 corner", "Roman Handles", "Floated Panels", "Gas Hinge", "Bar Handles steel black 192mm",
  "Airvents", "Panels", "stickers", "Sticker pack", "Chrome hanging rail", "Silicone -grey", "Bits 8mm",
  "Neptune handles 192mm", "Metal bits", "Concrete bits", "Big Push to Open", "Metal Glass Clips",
  "Post Form joiners", "U Channel", "TOP Guide", "Bottom Guide", "Profile", "Wheels Set",
  "Rail Center Support", "Roman handles 288mm", "Masonary Bits", "Handles 288 Bar", "Glass studs",
  "Keys", "Chrome handles 192mm", "Chrome handles 288", "Hooks", "Granite", "Dry walls -25mm",
  "Woodfiller brown", "16mm Square Screws", "30mm Square Screws", "40mm Square Screws",
  "16mm Box Square Screws", "30mm Box Square Screws", "40mm Box Square Screws", "30mm Screws Box",
  "16mm Box Screws", "40mm Box Screws", "Fix It Glue", "Drywalls-25", "288mm Light  handles",
  "Postform full", "Postform half", "Gold Handles 192", "Aluminium kickplate", "Woodglue", "Cloth",
  "Screw covers white pack", "Screw covers color pack", "Rhinotape", "L-angle", "U-Tracks",
  "Drywall screws 3.5X20 (Box)", "Wire nails (kg)", "Steel nails (Kg)", "Kickplate joiners",
  "Ends Hanging rail", "Mutton Cloth", "Kick plate", "Brad nails half", "1 inch nails",
  "Strip handles 128mm", "Strip handles 320mm", "Routing charges", "Speckled white", "Round leg",
  "Star black", "Corner brackets big", "Postform double (900)", "Hanger centre chrome",
  "Plastic brackets TapIn", "H Channel", "2.5m U Channel", "Concrete nails (kg)",
  "Interior Flash Doors [Clearance price]", "Transport", "Glass", "Line handles (3m)", "Mirror 3mm",
  "Cornice pine 6m", "Polishing Brush", "Chrome legs 50mm", "Island Quartz (1.7X0.7)",
  "Quartz Star Black [1800X900]", "192mm Light black handle", "Main BiC", "BiC 1", "BiC 2",
  "PVC Ceiling (6X0.2)", "3 inch Wire nails", "Cornices", "Labour (Ceiling)",
  "Quartz Stone White (1820X1135)", "Glasses", "Bradnail 30", "Stick like Shit Glue Devil",
  "PTO 300 runners", "Flutted Wall Panels (Special)", "Nordic Handles", "450mm PTO runners",
  "PTO 450 RUNNERS", "PTO 350 RUNNERS"
];

const EDGING_TYPE_OPTIONS = [
  "None", "1 Long", "2 Long", "1 Short", "2 Short", "All Round",
  "1 Long 1 Short", "2 Long 1 Short", "1 Long 2 Short"
];

const EDGING_MATERIAL_OPTIONS = [
  "White matt edging", "Colour Edging", "Storm grey matt edging", "Storm grey gloss edging",
  "White gloss edging", "Grigio Matt Edging", "American W Matt", "Black Gloss Edging",
  "Black matt edging", "Black matt 2mm", "0.4mm Lucaurban edging", "0.4mm Loose edging",
  "32mm Edging", "0.4mm Black matt edging", "White Edging", "Grain Colored Edging",
  "32mm Own Edging Charge", "Black Edging", "Gloss White Edging", "Grain colored - 32mm",
  "American Walnut Gloss", "Brookhill edging", "Folkstone Grey Matt Edging", "Gloss Edging",
  "Grigio Edging", "Leatherwood Edging", "Loose edging", "0.4 White edging", "0.4 Loose edging",
  "Folkstone Grey Gloss", "0.4mm color edging", "Congo 0.4 Edging", "Black Cherry Edging",
  "Caraz Edging", "Loose - Folkstone grey matt", "0.4 own edging", "Dunblane Grey Edging",
  "Natural Oak Edging", "2mm white edging", "2mm black edging", "0.4 Lucaurban edging",
  "American  Walnut edging", "Own Edging charge", "0.4 Lucapolenta edging", "0.4mm black edging",
  "Harvard cherry edging", "0.4mm s/grey edging", "African Wenge Edging", "Cappuccino edging",
  "Coimbra loose edging", "White Loose edging", "32mm Storm Grey Matt", "Coimbra Edging",
  "Folkstone gloss edging [Lawlinon]", "Camden Edging", "Cascade Edging", "Grooving per metre",
  "0.4mm red edging", "Iceberg gloss Edging [Promotion]", "Sahara Edging", "Royal Mahogany Edging",
  "Cappuccino gloss edging", "32mm White Edging", "Petrol Blue Edging", "Gloss Edging (promo)",
  "Dunblane grey matt edging", "Dunblane grey gloss edging", "PVC Edge"
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, category } = await req.json();
    
    if (!query || !category) {
      throw new Error('Query and category are required');
    }

    console.log(`Smart search request - Category: ${category}, Query: ${query}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Get the appropriate options list based on category
    let options: string[] = [];
    let categoryDescription = '';
    
    if (category === 'material') {
      options = MATERIAL_OPTIONS;
      categoryDescription = 'material types for cutting (wood, melamine, boards, etc.)';
      
      const lowerQuery = query.toLowerCase().trim();
      
      // Check for specific color names BEFORE checking for generic "color" keyword
      const specificColors = [
        { keywords: ['storm grey', 'storm gray', 'stormgrey', 'stormgray'], matches: ['Storm grey matt', 'Storm grey gloss'] },
        { keywords: ['grigio'], matches: ['Grigio Matt', 'Grigio'] },
        { keywords: ['folkstone', 'folk stone'], matches: ['Folkstone Grey Matt Board', 'Folkstone Grey Gloss'] },
        { keywords: ['dunblane'], matches: ['Dunblane Grey Matt Board'] },
        { keywords: ['congo'], matches: ['Congo Matt'] },
        { keywords: ['cappuccino', 'capuccino', 'cappucino'], matches: ['Capuccino Board Matt', 'Capuccino Gloss'] },
        { keywords: ['petrol blue', 'petrol'], matches: ['Petrol Blue'] },
        { keywords: ['black matt', 'black mat'], matches: ['Black Matt', 'Black Board Matt'] },
        { keywords: ['black cherry'], matches: ['Black Cherry board'] },
        { keywords: ['harvard cherry'], matches: ['Harvard Cherry Board'] },
        { keywords: ['natural oak'], matches: ['Natural Oak Matt'] },
        { keywords: ['shale oak', 'shale'], matches: ['Shale Oak', 'Washed Shale'] },
        { keywords: ['brookhill'], matches: ['Brookhill Matt'] },
        { keywords: ['sahara'], matches: ['Sahara Board Matt'] },
        { keywords: ['coimbra'], matches: ['Coimbra Board Matt'] },
        { keywords: ['camden'], matches: ['Camden Board Matt'] },
        { keywords: ['cascade'], matches: ['Cascade Board Matt'] },
        { keywords: ['american walnut'], matches: ['American Walnut'] },
        { keywords: ['royal mahogany'], matches: ['Royal Mahogany'] },
        { keywords: ['iceberg'], matches: ['Iceberg white-Gloss'] },
      ];
      
      for (const colorMatch of specificColors) {
        if (colorMatch.keywords.some(kw => lowerQuery.includes(kw))) {
          return new Response(
            JSON.stringify({ 
              success: true,
              matches: colorMatch.matches,
              query,
              category
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      
      // Only use "Color Board [TBA]" if query is EXACTLY "color" or "colour" (no other words)
      if (lowerQuery === 'color' || lowerQuery === 'colour') {
        return new Response(
          JSON.stringify({ 
            success: true,
            matches: ['Color Board [TBA]'],
            query,
            category
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Special case: if query is "masonites" or "massonites", return "Masonite 2.4"
      if (lowerQuery === 'masonites' || lowerQuery === 'massonites') {
        return new Response(
          JSON.stringify({ 
            success: true,
            matches: ['Masonite 2.4'],
            query,
            category
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (category === 'edging_type') {
      options = EDGING_TYPE_OPTIONS;
      categoryDescription = 'edging application patterns (how many edges to apply edging to)';
      
      const lowerQuery = query.toLowerCase().trim();
      
      // Special case: if query contains "doors", return "All Round"
      if (lowerQuery.includes('door')) {
        return new Response(
          JSON.stringify({ 
            success: true,
            matches: ['All Round'],
            query,
            category
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (category === 'edging_material') {
      options = EDGING_MATERIAL_OPTIONS;
      categoryDescription = 'edging material products (specific edging products/finishes)';
    } else {
      throw new Error('Invalid category');
    }

    // Call Lovable AI to reason about the query
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are helping users find the correct ${categoryDescription} from a list. 
            
Users might use informal terms, abbreviations, misspellings, or describe what they want instead of using exact names.

Your task:
1. Understand what the user is looking for based on their query
2. Return the top 5 most relevant matches from the provided list
3. Return results as a JSON array of strings, ordered by relevance (most relevant first)
4. If the query is very short or unclear, return multiple reasonable options
5. Handle common synonyms, abbreviations, and variations

Examples:
- "white" could match "White Melamine", "White Edging", "Gloss white board"
- "PVC" could match "PVC Board 2.4", "PVC Edge", "PVC (2.4X1.2)"
- "1L" or "one long" should match "1 Long"
- "around" or "all" could match "All Round"
- "matt" or "matte" or "mat" should all match matt finishes

Return ONLY a valid JSON array of strings, nothing else.`
          },
          {
            role: 'user',
            content: `Available options:\n${options.join('\n')}\n\nUser query: "${query}"\n\nReturn top 5 matches as JSON array.`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      // Fallback to simple string matching
      const lowerQuery = query.toLowerCase();
      const matches = options.filter(opt => 
        opt.toLowerCase().includes(lowerQuery)
      ).slice(0, 5);
      
      return new Response(
        JSON.stringify({ 
          success: true,
          matches: matches.length > 0 ? matches : options.slice(0, 5),
          fallback: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    const aiResponse = result.choices?.[0]?.message?.content || '[]';
    
    console.log('AI response:', aiResponse);
    
    // Parse the AI response
    let matches: string[];
    try {
      // Extract JSON array from the response (AI might add extra text)
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        matches = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON array found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback to simple string matching
      const lowerQuery = query.toLowerCase();
      matches = options.filter(opt => 
        opt.toLowerCase().includes(lowerQuery)
      ).slice(0, 5);
    }

    // Ensure all matches are valid options
    matches = matches.filter(match => options.includes(match)).slice(0, 5);
    
    // If no matches, return top 5 from simple search
    if (matches.length === 0) {
      const lowerQuery = query.toLowerCase();
      matches = options.filter(opt => 
        opt.toLowerCase().includes(lowerQuery)
      ).slice(0, 5);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        matches: matches.length > 0 ? matches : options.slice(0, 5),
        query,
        category
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in smart-search function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process search';
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
