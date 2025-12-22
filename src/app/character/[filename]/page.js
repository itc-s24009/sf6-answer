'use server';

// @/ は src フォルダを直接指します。これで迷子になりません。
import prisma from '@/lib/prisma'; 
import Link from 'next/link';
import { revalidatePath } from 'next/cache';

export default async function CharacterDetail({ params }) {
  // パラメータの取得
  const p = await params;
  const decodedFilename = decodeURIComponent(p.filename);

  // --- お気に入り切り替え（サーバーアクション） ---
  async function toggleFavoriteAction(condId) {
    'use server';
    try {
      // キャラ名の一致を確実にするため内部で prisma を再インポートして使うのが本番の定石
      const db = (await import('@/lib/prisma')).default;
      
      const existing = await db.favorite.findUnique({
        where: { conditionId_charaName: { conditionId: condId, charaName: decodedFilename } }
      });

      if (existing) {
        await db.favorite.delete({ where: { id: existing.id } });
      } else {
        await db.favorite.create({
          data: { conditionId: condId, charaName: decodedFilename }
        });
      }
      revalidatePath(`/character/${p.filename}`);
    } catch (e) {
      console.error("FAV ACTION ERROR:", e);
    }
  }

  // --- データの取得 ---
  try {
    // 取得部分：ここでお気に入りされている順に並び替え
    const allMatching = await prisma.condition.findMany({
      where: { charas: { has: decodedFilename } },
    });

    const myFavorites = await prisma.favorite.findMany({
      where: { charaName: decodedFilename }
    });

    // どの条件がお気に入り済みか判別
    const favSet = new Set(myFavorites.map(f => f.conditionId));
    
    // お気に入り優先ソート
    const sorted = allMatching
      .map(c => ({ ...c, isFav: favSet.has(c.id) }))
      .sort((a, b) => (a.isFav === b.isFav ? 0 : a.isFav ? -1 : 1));

    return (
      <div className="wrapper">
        <header className="main-header">
            <div className="logo">{decodedFilename.split('.')[0].toUpperCase()}</div>
            <Link href="/" className="header-btn select-mode" style={{textDecoration:'none'}}>BACK</Link>
        </header>

        <main style={{ padding: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent:'center' }}>
            <div className="card matched" style={{ width: '260px', height: '400px' }}>
                <img src={`/sf6/${decodedFilename}`} alt="" style={{ width: '100%', marginLeft: 0 }} />
            </div>

            <div style={{ flex: '1', minWidth: '300px', background: '#111', padding: '20px', border: '1px solid #333' }}>
                <h3 style={{ color: 'var(--accent)', borderBottom: '1px solid #333', paddingBottom: '15px' }}>
                    MATCHING CONDITIONS
                </h3>
                <div className="archive-list" style={{ marginTop: '20px' }}>
                    {sorted.length > 0 ? (
                        sorted.map(item => (
                            <div key={item.id} className="archive-btn-wrap">
                                <div className={`archive-main-btn ${item.isFav ? 'fav-active' : ''}`} style={{ cursor: 'default', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <span style={{flex: 1}}>{item.text}</span>
                                    <form action={toggleFavoriteAction.bind(null, item.id)}>
                                        <button type="submit" style={{ background:'none', border:'none', color: item.isFav ? 'var(--accent)' : '#444', cursor:'pointer', fontSize:'24px' }}>
                                            {item.isFav ? '★' : '☆'}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p style={{color:'#666'}}>登録されている条件はありません</p>
                    )}
                </div>
            </div>
        </main>
      </div>
    );
  } catch (err) {
    // 万が一落ちた時に Vercel の画面でエラー内容を見れるようにします
    console.error("PAGE DATA LOAD ERROR:", err);
    return (
      <div style={{padding: '50px', color: 'red'}}>
        <h3>キャラクター情報の読み込み中にエラーが発生しました</h3>
        <p>エラー詳細: {err.message}</p>
        <p>インポートパスまたはデータベースの同期を確認してください。</p>
      </div>
    );
  }
}