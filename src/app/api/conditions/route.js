import { NextResponse } from 'next/server';
// @/libs ではなく ../../../lib/ にして確実にファイルを読み込ませます
import prisma from '../../../lib/prisma'; 

// 1. 全データを読み出す
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

// 2. 新しく保存する
export async function POST(req) {
  try {
    const { text, charas, isInverseEnabled, inverseText, allCharas } = await req.json();
    const mainId = 'D' + Date.now();

    await prisma.condition.create({
      data: { id: mainId, text, charas }
    });

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

// 3. 編集（更新）する機能を追加！
export async function PUT(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id'); // URLの後ろの ?id= を読み取る
    const { text, charas } = await req.json();

    await prisma.condition.update({
      where: { id: id },
      data: { text, charas }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 4. 消去する
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id'); // URLの後ろの ?id= を読み取る

    await prisma.condition.delete({
      where: { id: id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}