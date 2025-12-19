import { NextResponse } from 'next/server';
import prisma from '@/libs/prisma';

// データを読み出す
export async function GET() {
  try {
    const conditions = await prisma.condition.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(conditions);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// データを新しく保存する
export async function POST(req) {
  try {
    const { text, charas, isInverseEnabled, inverseText, allCharas } = await req.json();
    const mainId = 'D' + Date.now();

    // 1つ目の条件を保存
    await prisma.condition.create({
      data: { id: mainId, text, charas }
    });

    // 「反対」も同時に作るチェックが入っている場合
    if (isInverseEnabled && inverseText) {
      const invCharas = allCharas.filter(f => !charas.includes(f));
      if (invCharas.length > 0) {
        await prisma.condition.create({
          data: { id: 'I' + Date.now(), text: inverseText, charas: invCharas }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// IDを指定した削除
export async function DELETE(req) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    try {
        await prisma.condition.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}