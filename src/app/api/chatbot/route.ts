import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    // In a production app, this would integrate with an LLM provider (OpenAI, Anthropic, etc.)
    // For now, it provides rule-based responses based on HOS lore

    let botResponse = "I've logged your query. As an AI, my current database is limited, but I am learning more about Server 1895 every day.";
    const lowerInput = query.toLowerCase();

    if (lowerInput.includes('hos') || lowerInput.includes('house of spanking')) {
      botResponse = "House of Spanking (HOS) is the undisputed ruling alliance of Server 1895. We value loyalty, power, and unity.";
    } else if (lowerInput.includes('svs') || lowerInput.includes('server war')) {
      botResponse = "During SVS, all shields must be down unless explicitly permitted by R5/R4. Ensure your generals are equipped and troops are ghosted if you cannot defend.";
    } else if (lowerInput.includes('rules')) {
      botResponse = "Basic Rules: 1. No attacking NAPs. 2. Mandatory participation in SVS. 3. Respect leadership. 4. Always read Alliance Mail.";
    } else if (lowerInput.includes('admin') || lowerInput.includes('login')) {
       botResponse = "Admin access is restricted. The entry point is hidden in plain sight. Only true leadership knows the sequence.";
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 800));

    return NextResponse.json({ response: botResponse });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process chat query' }, { status: 500 });
  }
}
