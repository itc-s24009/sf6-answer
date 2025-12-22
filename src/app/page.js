'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const charaFilenames = [
  'a.k.i..png', 'dhalsim.png', 'jamie.png', 'lily.png', 'sagat.png',
  'blanka.png', 'e.honda.png', 'jp.png', 'luke.png', 'terry.png',
  'c.viper.png', 'ed.png', 'juri.png', 'mai.png', 'vega.png',
  'cammy.png', 'elena.png', 'ken.png', 'manon.png', 'zangief.png',
  'chun-li.png', 'gouki.png', 'kimberly.png', 'marisa.png',
  'dee_jay.png', 'guile.png', 'rashid.png', 'ryu.png'
];

export default function Home() {
  const [archiveData, setArchiveData] = useState([]);
  const [activeCondition, setActiveCondition] = useState({ id: 'all', text: 'すべてのキャラクター' });
  const [modalType, setModalType] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [mounted, setMounted] = useState(false);

  const [formText, setFormText] = useState('');
  const [isInverseEnabled, setIsInverseEnabled] = useState(false);
  const [inverseText, setInverseText] = useState('');
  const [pickingSet, setPickingSet] = useState(new Set());

  // 1. APIから条件データを取得する関数
  const fetchConditions = async () => {
    try {
      const res = await fetch('/api/conditions');
      const data = await res.json();
      if (!data.error) {
        setArchiveData(data);
      }
    } catch (err) {
      console.error("データの取得に失敗しました", err);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchConditions(); // 初回起動時にデータベースから読み込み
  }, []);

  if (!mounted) return <div style={{ background: '#000', height: '100vh' }} />;

  // 2. データベースへの保存（新規作成 or 更新）
// --- src/app/page.js 内の handleSave 関数を修正 ---
const handleSave = async () => {
  if (!formText || pickingSet.size === 0) return alert("文言とキャラを選択してください");

  try {
    const body = {
      text: formText,
      charas: Array.from(pickingSet),
      isInverseEnabled,
      inverseText,
      allCharas: charaFilenames
    };

    if (editingItem) {
      // 【ここを修正】 URLの書き方を ?id= の形にする
      await fetch(`/api/conditions?id=${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } else {
      // 新規作成時（変更なし）
      await fetch('/api/conditions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }

    await fetchConditions(); // データの再読み込み
    setModalType(null);
  } catch (err) {
    alert("通信エラーが発生しました");
  }
};
  // 3. データベースからの消去
const deleteItem = async (id) => {
  if (!confirm('本当に消去しますか？')) return;

  try {
    // URLの最後に ?id=ID番号 をつけて送る！
    await fetch(`/api/conditions?id=${id}`, {
      method: 'DELETE',
    });
    await fetchConditions();
  } catch (err) {
    alert("消去できませんでした");
  }
};

  return (
    <div className="wrapper">
      <header className="main-header">
        <div className="logo">ANSWERS <span className="version">POSTGRES</span></div>
        <div className="btn-group">
          <button className="header-btn select-mode" onClick={() => setModalType('select')}>
            <span className="material-symbols-outlined">segment</span>条件を選ぶ
          </button>
          <button className="header-btn add-mode" onClick={() => {
            setEditingItem(null);
            setFormText('');
            setIsInverseEnabled(false);
            setInverseText('');
            setPickingSet(new Set());
            setModalType('form');
          }}>
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>
      </header>

      <div className="condition-billboard">
        <div className="billboard-inner">
          <label>RESULT FOR:</label>
          <h1 id="activeCondition">{activeCondition.text}</h1>
        </div>
      </div>

      <main className="gallery-container">
  <div className="character-grid">
    {charaFilenames.map(file => {
      const isMatched = activeCondition.id !== 'all' && activeCondition.charas?.includes(file);
      return (
        /* カードをLinkで囲む（/character/ryu.png のようになる） */
        <Link key={file} href={`/character/${file}`} className={`card ${isMatched ? 'matched' : ''}`}>
          <img src={`/sf6/${file}`} alt="" />
        </Link>
      );
    })}
  </div>
</main>


      {/* アーカイブポップアップ */}
      {modalType === 'select' && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-top">
              <h2>DATABASE ARCHIVE</h2>
              <button className="modal-close" onClick={() => setModalType(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="archive-list">
              <button className="archive-main-btn" onClick={() => {
                setActiveCondition({ id: 'all', text: 'すべてのキャラクター' });
                setModalType(null);
              }}>
                【表示リセット】全キャラ表示
              </button>
              {archiveData.map(item => (
                <div key={item.id} className="archive-btn-wrap">
                  <button className="archive-main-btn" onClick={() => {
                    setActiveCondition(item);
                    setModalType(null);
                  }}>
                    {item.text}
                  </button>
                  <button className="edit-mini-btn" onClick={() => {
                    setEditingItem(item);
                    setFormText(item.text);
                    setPickingSet(new Set(item.charas));
                    setModalType('form');
                  }}>編集</button>
                  <button className="del-mini-btn" onClick={() => deleteItem(item.id)}>消去</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 作成・編集ポップアップ */}
      {modalType === 'form' && (
        <div className="modal-overlay">
          <div className="modal-box large">
            <div className="modal-top">
              <h2>{editingItem ? 'EDIT CONDITION' : 'CREATE CONDITION'}</h2>
              <button className="modal-close" onClick={() => setModalType(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="edit-layout">
              <div className="edit-left">
                <textarea 
                  value={formText} 
                  onChange={e => setFormText(e.target.value)} 
                  placeholder="ここに条件を記入（例：リーチが長く牽制が強い）" 
                />
                {!editingItem && (
                  <div className="inverse-option-area">
                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="checkbox" checked={isInverseEnabled} onChange={e => setIsInverseEnabled(e.target.checked)} /> 
                      <span>「反対」の条件（選ばなかったキャラ用）も同時に作る</span>
                    </label>
                    {isInverseEnabled && (
                      <textarea 
                        value={inverseText} 
                        onChange={e => setInverseText(e.target.value)} 
                        placeholder="反対の条件文を記入（例：近接戦がメインで牽制は弱め）" 
                        style={{ marginTop: 10, minHeight: '80px' }}
                      />
                    )}
                  </div>
                )}
                <button className="confirm-btn" onClick={handleSave}>
                  {editingItem ? '更新を保存する' : 'データベースに保存して完了'}
                </button>
              </div>
              <div className="edit-right">
                <div className="mini-chara-grid">
                  {charaFilenames.map(f => (
                    <div 
                      key={f} 
                      className={`mini-card ${pickingSet.has(f) ? 'active' : ''}`} 
                      onClick={() => {
                        const n = new Set(pickingSet);
                        n.has(f) ? n.delete(f) : n.add(f);
                        setPickingSet(n);
                      }}
                    >
                      <img src={`/sf6/${f}`} alt="" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}