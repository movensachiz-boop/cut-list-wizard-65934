import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    console.log('Analyzing image for cutting list dimensions...');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

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
            content: `You are an expert at reading cutting lists from images. Extract ONLY cutting dimensions that are ACTUALLY VISIBLE in the image.

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

VERIFICATION STEP:
Before returning, review each extracted entry:
- Can I actually see this exact dimension in the image?
- Am I 100% certain this isn't a hallucination?
- Did I carry forward the material correctly for sections without material labels?
- If NO to any question, REVIEW or REMOVE the entry

If you cannot find any items, return "NO_DIMENSIONS_FOUND"`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all cutting list dimensions from this image. Return them in LengthXWidthXQuantity format, one per line.'
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
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const result = await response.json();
    const extractedText = result.choices?.[0]?.message?.content || '';
    
    console.log('Extracted text:', extractedText);

    // Parse the extracted cutting dimensions
    const lines = extractedText.split('\n').filter((line: string) => line.trim());
    const dimensions: Array<{ 
      value: string; 
      confidence: string; 
      material?: string; 
      edging?: string;
    }> = [];

    for (const line of lines) {
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

    if (dimensions.length === 0 && extractedText.includes('NO_DIMENSIONS_FOUND')) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No cutting dimensions found in the image. Please ensure the image contains clear dimension information.' 
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
        count: dimensions.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-image function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze image';
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
