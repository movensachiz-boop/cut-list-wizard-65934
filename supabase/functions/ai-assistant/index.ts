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
    const { messages } = await req.json();
    
    console.log('AI Assistant request:', { messageCount: messages?.length });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are a helpful AI assistant for FastCut, a cutting list management application for furniture manufacturing and woodworking.

You can help users with:
1. **App Features & Usage**:
   - How to create and manage cutting lists
   - How to save and load cutting lists
   - How to use the image analysis feature to extract cut sizes from photos
   - How to use Smart Select for quick material and edging selection

2. **Materials & Technical Knowledge**:
   - Material recommendations (melamine, MDF, plywood, glass, Color Board, Storm Grey, Superwood, etc.)
   - Edging types and when to use them (None, 1 Long, 2 Long, 1 Short, 2 Short, All Round, combinations)
   - Cutting optimization strategies for minimal waste
   - Industry best practices

3. **Troubleshooting**:
   - Help users understand error messages
   - Guide them through common issues
   - Provide step-by-step solutions

4. **Interactive Actions**:
   - You can directly manipulate the cutting list by adding, removing, or updating items
   - You can change materials and edging settings
   - When the user asks you to perform actions, use the provided tools to make changes

**CRITICAL DIMENSION NOTATION**:
- When user writes "o" after dimensions (e.g., "123x334x2 o"), the "o" means "All Round" edging
- Format: length x width x quantity o → set edging="All Round"
- Example: "123x334x2 o" means length=123, width=334, quantity=2, edging="All Round"

**SHORT EDGING NOTATION**:
- "2 short" or "2 Short" or "2w" means edging on BOTH width sides → set edging="2 Short"
- "1 short" or "1 Short" or "1w" means edging on ONE width side → set edging="1 Short"
- "2 long" or "2 Long" or "2l" means edging on BOTH length sides → set edging="2 Long"
- "1 long" or "1 Long" or "1l" means edging on ONE length side → set edging="1 Long"
- If the width number (second number) is double underlined or marked to the widths → means "2 Short"
- If the width number (second number) is single underlined or marked to the widths → means "1 Short"
- These width notations apply edging to the width columns/sides, not the length sides

**EDGING THICKNESS NOTATION**:
- If a measurement like "32mm" or "32" appears after L x W x QTY, it indicates edging thickness
- Format: "length x width x quantity 32mm" or "length x width x quantity 32"
- Set edgingMaterial to "32mm Edging" (or the specified thickness)
- Example: "300x200x5 32mm" means edgingMaterial="32mm Edging"
- If edgingMaterial is not already specified, add the thickness notation to it

**CRITICAL EDGING BEHAVIOR**:
- When adding items and NO edging information is provided by the user, DO NOT include edging or edgingMaterial parameters in the tool call - let the backend apply defaults automatically
- When user provides dimensions only (e.g., "300x45x10"), omit edging parameters entirely
- Backend will automatically apply these defaults when edging is not specified:
  * Masonite, PVC, Quartz: "None"
  * Color Board, White Melamine: "1 Long" with "Color" edging
  * All other materials: "1 Long"
- Materials with "gloss" in the name (e.g., "Storm Grey (Gloss)"):
  * Material will be set to "High Gloss"
  * Edging material will be "Gloss"
- Only include edging parameters when user explicitly specifies edging type (e.g., "All Round", "2 Long", etc.)

When answering:
- Be friendly, conversational, and helpful
- Provide clear, step-by-step guidance when explaining how to use features
- Be specific and practical with recommendations
- Keep responses concise but thorough
- If users seem stuck, proactively suggest solutions
- When asked to make changes, use the tools to perform the actions directly`;

    const tools = [
      {
        type: "function",
        function: {
          name: "add_cutting_item",
          description: "Add a new item to the cutting list",
          parameters: {
            type: "object",
            properties: {
              length: { type: "number", description: "Length in millimeters" },
              width: { type: "number", description: "Width in millimeters" },
              quantity: { type: "number", description: "Number of pieces" },
              material: { type: "string", description: "Material type" },
              edging: { type: "string", description: "Edging type (e.g., None, All Round, 1 Long)" },
              edgingMaterial: { type: "string", description: "Edging material" },
              notes: { type: "string", description: "Optional notes" }
            },
            required: ["length", "width", "quantity", "material"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "remove_cutting_items",
          description: "Remove items from the cutting list by their IDs",
          parameters: {
            type: "object",
            properties: {
              itemIds: { 
                type: "array", 
                items: { type: "string" },
                description: "Array of item IDs to remove" 
              }
            },
            required: ["itemIds"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "update_cutting_item",
          description: "Update an existing item in the cutting list",
          parameters: {
            type: "object",
            properties: {
              itemId: { type: "string", description: "ID of the item to update" },
              length: { type: "number", description: "New length in millimeters" },
              width: { type: "number", description: "New width in millimeters" },
              quantity: { type: "number", description: "New quantity" },
              material: { type: "string", description: "New material type" },
              edging: { type: "string", description: "New edging type" },
              edgingMaterial: { type: "string", description: "New edging material" },
              notes: { type: "string", description: "New notes" }
            },
            required: ["itemId"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "clear_cutting_list",
          description: "Clear all items from the cutting list",
          parameters: {
            type: "object",
            properties: {}
          }
        }
      }
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        tools: tools,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded. Please try again in a moment.' 
          }),
          { 
            status: 429, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: 'AI usage limit reached. Please contact support.' 
          }),
          { 
            status: 402, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message;

    if (!message) {
      throw new Error('No response from AI');
    }

    console.log('AI Assistant response generated');
    console.log('Message:', JSON.stringify(message, null, 2));
    console.log('Tool calls:', message.tool_calls);

    // Process tool calls - only handle gloss material normalization
    const processedToolCalls = message.tool_calls?.map((toolCall: any) => {
      if (toolCall.function.name === 'add_cutting_item' || toolCall.function.name === 'update_cutting_item') {
        const args = JSON.parse(toolCall.function.arguments);
        
        // Only normalize gloss materials to "High Gloss" - don't add any edging defaults here
        if (args.material) {
          const materialLower = args.material.toLowerCase();
          
          if (materialLower.includes('gloss')) {
            args.material = 'High Gloss';
            // Only set edging material to Gloss if not already specified
            if (!args.edgingMaterial) {
              args.edgingMaterial = 'Gloss';
            }
          }
        }
        
        toolCall.function.arguments = JSON.stringify(args);
      }
      return toolCall;
    });

    // Return both the answer and any tool calls
    return new Response(
      JSON.stringify({ 
        success: true, 
        answer: message.content || '',
        toolCalls: processedToolCalls || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AI Assistant error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
