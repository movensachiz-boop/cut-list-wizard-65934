import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData } = await req.json();
    
    if (!imageData) {
      throw new Error('No image data provided');
    }

    console.log('Analyzing image for cutting list dimensions and hardware...');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Fetch hardware items from database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: hardwareItems } = await supabase
      .from('hardware_items')
      .select('id, name, short_name');

    const hardwareList = hardwareItems?.map(h => h.name).join(', ') || '';
    console.log('Hardware items loaded:', hardwareItems?.length || 0);

    // Call Lovable AI with vision model
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
            content: `You are an expert at reading cutting lists from images. Extract ONLY items that are ACTUALLY VISIBLE in the image.

== SECTION 1: CUTTING DIMENSIONS ==
Extract cutting dimensions (panels, boards, sheets) that you can clearly see.

CRITICAL RULES - DOUBLE VERIFICATION REQUIRED:
1. ONLY extract items that you can clearly see written or printed in the image
2. DO NOT hallucinate or invent items that aren't there
3. DO NOT add entries if you're unsure whether an item exists
4. After extracting, verify each entry against the image again before including it
5. When in doubt, DO NOT include the entry - it's better to miss one than to add a false one

Your task is to identify CUTTING DIMENSIONS (panels, boards, sheets):
1. Look for dimensions in format: Length X Width X Quantity

2. MATERIAL TRACKING RULE - VERY IMPORTANT:
   - Track the material as you read through sections
   - If a section specifies a material, use that material
   - If a section does NOT specify a material (like "Doors" alone), use the LAST SEEN material from previous lines
   - Example: If previous lines were "Color Board" and you see "Doors" without a material, use "Color Board"

 3. MATERIAL MAPPING - Map what you see to these exact material names:
   - "W", "White", "W:", "White:", "white" → White Melamine
   - "C", "Color", "Colorboard", "Color Board", "Colour", "colour", "C:", "Color:", any color name with "board" → Color Board [TBA]
   - "Doors", "Door", "Flash doors" (when it appears WITH a color/material) → Use that color/material, not "Interior Flash Doors"
   - "Doors", "Door", "Flash doors" (when it appears ALONE) → Carry forward the last seen material
   - "Gloss", "gloss", "High Gloss", "high gloss" → High Gloss
   - "SW", "Superwood" → Superwood
   - "MDF", "mdf" → MDF Boards
   - "PVC", "pvc" → PVC Board 2.4
   - "Masonite", "masonite", "M:" → Masonite 2.4
   - "Glass", "glass" → Glass 4mm
   - "Plywood", "plywood" → Plywood
   - If unsure, use "Unknown"

 4. EDGING RULES:
    - For items labeled "Doors" or "Door", ALWAYS set edging to "All Round"
    - Otherwise recognize edging abbreviations:
      * "1L" or "1l" or "1 Long" = 1 Long
      * "2L" or "2l" or "2 Long" = 2 Long  
      * "1W" or "1w" or "1 Width" or "1 Short" or "1S" or "1s" = 1 Short
      * "2W" or "2w" or "2 Width" or "2 Short" or "2S" or "2s" = 2 Short
      * "AR" or "All Round" or "o" (letter o) = All Round
      * "NE" or "ne" or "None", "No edge", "-" = None
   
   **CRITICAL: UNDERLINE DETECTION FOR EDGING**
   LOOK VERY CAREFULLY for ANY visual emphasis on numbers (underlines, highlights, or marks):
   
   UNDERLINE RULES (HIGHEST PRIORITY - CHECK THIS FIRST):
   - If you see the FIRST number (length) with ONE line under it → edging = "1 Long"
   - If you see the FIRST number (length) with TWO lines under it or double-underlined → edging = "2 Long"
   - If you see the SECOND number (width) with ONE line under it → edging = "1 Short"
   - If you see the SECOND number (width) with TWO lines under it or double-underlined → edging = "2 Short"
   - If BOTH numbers have underlines (any combination) → edging = "All Round"
   
   Underlines can appear as:
   - Straight line(s) under the number: 300 with line(s) below
   - Hand-drawn line(s) beneath digits
   - Highlighted or emphasized numbers
   - Numbers in boxes or circles (treat as underlined)
   
   EXAMPLES:
   - "300 x 400 x 2" where 300 has one underline → material="...|1 Long"
   - "300 x 400 x 2" where 400 has one underline → material="...|1 Short"
   - "300 x 400 x 2" where both are underlined → material="...|All Round"
   - "300 x 400 x 2" where 400 has double underline → material="...|2 Short"
   
   EDGING THICKNESS NOTATION:
   - If you see a measurement like "32mm" or "32" after dimensions, include it in the edging info
   - Format: Include the thickness with the edging type (e.g., "1 Long|32mm Edging")

5. Return format: LengthXWidthXQuantity|CONFIDENCE|MATERIAL|EDGING
   Example: 300X400X2|high|White Melamine|2 Long
   Example: 1760X496X1|high|Color Board [TBA]|All Round (for a door using color board material)

CONFIDENCE LEVELS:
- "high": very clear match, exact or near-exact
- "medium": good match but some uncertainty
- "low": fuzzy match, best guess

== SECTION 2: HARDWARE ITEMS ==
Also look for HARDWARE ITEMS like hinges, handles, screws, runners, etc.
The available hardware items in the system are: ${hardwareList}

When you find hardware, return it in this format on SEPARATE lines:
HARDWARE:quantity|item_name|confidence
Example: HARDWARE:10|Soft Close Hinges 35mm|high
Example: HARDWARE:4|Bar Handle 192mm Matt Black|medium
Example: HARDWARE:50|Confirmat Screws 7x50|high

Match the hardware names as closely as possible to the available items.

VERIFICATION STEP:
Before returning, review each extracted entry:
- Can I actually see this exact dimension/hardware in the image?
- Am I 100% certain this isn't a hallucination?
- Did I carry forward the material correctly for sections without material labels?
- If NO to any question, REVIEW or REMOVE the entry

If you cannot find any items, return "NO_ITEMS_FOUND"`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all cutting list dimensions AND hardware items from this image. Return dimensions in LengthXWidthXQuantity format and hardware as HARDWARE:quantity|name|confidence, one per line.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'Scanning is temporarily unavailable. Please try again later.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Too many scans right now. Please wait a moment and try again.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ success: false, error: 'Scanning could not be completed. Please try again later.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }


    const result = await response.json();
    const extractedText = result.choices?.[0]?.message?.content || '';
    
    console.log('Extracted text:', extractedText);

    // Parse the extracted cutting dimensions and hardware
    const lines = extractedText.split('\n').filter((line: string) => line.trim());
    const dimensions: Array<{ 
      value: string; 
      confidence: string; 
      material?: string; 
      edging?: string;
    }> = [];
    const hardware: Array<{
      quantity: number;
      name: string;
      confidence: string;
      matched_item?: { id: string; name: string };
    }> = [];

    for (const line of lines) {
      // Check for hardware items first
      const hardwareMatch = line.match(/HARDWARE:\s*(\d+)\s*\|\s*([^|]+)\s*\|\s*(high|medium|low)/i);
      if (hardwareMatch) {
        const hwQuantity = parseInt(hardwareMatch[1]);
        const hwName = hardwareMatch[2].trim();
        const hwConfidence = hardwareMatch[3].toLowerCase();
        
        // Try to match to database hardware items
        const matchedHw = hardwareItems?.find(h => 
          h.name.toLowerCase().includes(hwName.toLowerCase()) ||
          hwName.toLowerCase().includes(h.name.toLowerCase()) ||
          (h.short_name && h.short_name.toLowerCase().includes(hwName.toLowerCase()))
        );
        
        hardware.push({
          quantity: hwQuantity,
          name: hwName,
          confidence: hwConfidence,
          matched_item: matchedHw ? { id: matchedHw.id, name: matchedHw.name } : undefined
        });
        continue;
      }
      
      // Check if line matches cutting dimensions with material and edging
      const extendedMatch = line.match(/(\d+)\s*[xX*]\s*(\d+)\s*[xX*]\s*(\d+)\s*\|\s*(high|medium|low)\s*\|\s*([^|]+)\s*\|\s*(.+)/i);
      if (extendedMatch) {
        const material = extendedMatch[5].trim();
        const edging = extendedMatch[6].trim();
        dimensions.push({
          value: `${extendedMatch[1]}X${extendedMatch[2]}X${extendedMatch[3]}`,
          confidence: extendedMatch[4].toLowerCase(),
          material: material !== 'Unknown' ? material : undefined,
          edging: edging !== 'Unknown' ? edging : undefined
        });
      } else {
        // Check if line matches basic dimensions format
        const match = line.match(/(\d+)\s*[xX*]\s*(\d+)\s*[xX*]\s*(\d+)\s*\|\s*(high|medium|low)/i);
        if (match) {
          dimensions.push({
            value: `${match[1]}X${match[2]}X${match[3]}`,
            confidence: match[4].toLowerCase()
          });
        } else {
          // Fallback for lines without confidence
          const simpleMatch = line.match(/(\d+)\s*[xX*]\s*(\d+)\s*[xX*]\s*(\d+)/);
          if (simpleMatch) {
            dimensions.push({
              value: `${simpleMatch[1]}X${simpleMatch[2]}X${simpleMatch[3]}`,
              confidence: 'medium'
            });
          }
        }
      }
    }

    console.log('Parsed dimensions:', dimensions.length);
    console.log('Parsed hardware:', hardware.length);

    // Check if ANY item has edging information (excluding 'None')
    const hasAnyEdging = dimensions.some(dim => dim.edging && dim.edging !== 'None');
    
    // If NO edging found in entire sheet, apply defaults based on item type
    if (!hasAnyEdging && dimensions.length > 0) {
      dimensions.forEach(dim => {
        // Check if this is a masonite item
        const isMasonite = dim.material && 
          dim.material.toLowerCase().includes('masonite');
        
        // Check if this is a door item (by material name containing "door" or "Door")
        const isDoor = dim.material && (
          dim.material.toLowerCase().includes('door') || 
          dim.material.toLowerCase() === 'doors'
        );
        
        // Masonites get "None", Doors get "All Round", everything else gets "1 Long"
        if (isMasonite) {
          dim.edging = 'None';
        } else {
          dim.edging = isDoor ? 'All Round' : '1 Long';
        }
      });
    }

    if (dimensions.length === 0 && hardware.length === 0 && extractedText.includes('NO_ITEMS_FOUND')) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No cutting dimensions or hardware found in the image. Please ensure the image contains clear information.' 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        dimensions,
        hardware,
        count: dimensions.length,
        hardwareCount: hardware.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-image function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Scanning could not be completed. Please try again later.'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
