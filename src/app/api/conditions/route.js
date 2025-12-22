import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma'; // フォルダ名に合わせて lib または libs に修正してね

export async function GET() {
  try {
    const data = await prisma.condition.findMany({ 
      orderBy: { createdAt: 'desc' } 
    });

    // 取得したデータが何であれ、必ずJSONとして返す
    return NextResponse.json(data || []); 

  } catch (err) {
    console.error("API GET ERROR:", err);
    // 空っぽを返さず、必ずJSONでエラー内容を返すようにする
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}


export async function POST(req) {
  const { text, charas, isInverseEnabled, inverseText, allCharas } = await req.json();
  const id = 'D' + Date.now();
  await prisma.condition.create({ data: { id, text, charas } });
  if (isInverseEnabled && inverseText) {
    const inv = allCharas.filter(f => !charas.includes(f));
    await prisma.condition.create({ data: { id: 'I'+Date.now(), text: inverseText, charas: inv } });
  }
  return NextResponse.json({ success: true });
}

// 【編集用】これが動くには URL?id=xxx という形式で送る必要があります
export async function PUT(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id'); // URLからidを取得
    const { text, charas } = await req.json();

    await prisma.condition.update({
      where: { id: id },
      data: { text, charas }
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  await prisma.condition.delete({ where: { id: id } });
  return NextResponse.json({ success: true });
}