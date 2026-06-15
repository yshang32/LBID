# LBID v4 — 完整商業模式 + 系統架構整合文件

> 本文整合v2/v3所有決定 + Partner討論後嘅最終商業模式調整。
> 取代之前所有版本，作為Codex實作嘅最終參考。

---

# PART 1 — 商業模式總覽

## 1.1 平台定位

```
全名: LBID — Global Logistics Bid Platform
Slogan: "Match Once, Trust Long-term"
        配對一次，合作一世

定位:
  全世界中小型物流公司嘅雙向交易所
  + 行業生態系統 + 增值服務平台
```

## 1.2 用戶角色（Dual Role 雙重身份）

```
每個用戶 = 一間物流公司
        = 同時係 Client + Forwarder

  發SR時 → Client角色 (我要寄貨)
  Bid SR時 → Forwarder角色 (我幫你寄)

→ 一個帳戶，兩個身份，依場景切換
→ 適用全球: HK公司、東南亞、歐美都可
   成為平台用戶
```

## 1.3 三層會員制度

```
Layer 1: Read-only 觀察者 ($68-98/月，待確認)
  ✅ 瀏覽Directory(其他公司)
  ✅ 瀏覽SR列表(只見路線+貨類+剩餘名額)
  ✅ 睇平台流程介紹/增值服務
  ✅ 瀏覽Community貼文
  ❌ 唔可以發SR
  ❌ 唔可以Bid
  ❌ 公司資料唔上Directory
  
  → 戰略價值: 入場漏斗、FOMO轉化
                (睇得到but做唔到)

Layer 2: 月費會員 $388/月
  ✅ 全部Read-only功能
  ✅ 公司上Directory曝光
  ✅ 每月免費5 tokens(清零)
  ✅ 每月免費10個SR發布配額(清零)
  ✅ 完成配對額外獎勵+2 tokens(月內有效)
  ✅ Quotation/Rate Card/文件管理工具

Layer 3: 年費會員 $3,880/年 (= 送2個月)
  ✅ 月費全部功能
  ✅ 完成配對額外獎勵+4 tokens (月費嘅2倍)
  ✅ VIP金色Badge(Directory顯示)
  ✅ Priority Bid免費或半價
        (詳見Token章節)
  ✅ Directory排名加權(更前曝光)
```

## 1.4 Token經濟系統

### 1.4.1 Token用途

```
發SR (超出每月10個免費配額): 1 token/個
普通Bid: 1 token
Priority Bid: 2 tokens
   → Bid會優先顯示喺Client列表頭幾位
Directory置頂曝光: 5 tokens=1天 / 
                    25 tokens=7天
```

### 1.4.2 Token派發

```
月費會員: 每月免費5 tokens (月底清零)
年費會員: 每月免費5 tokens (月底清零)
  → 數量唔加，但特權多 (Priority Bid半價等)
  → "年費=身份，唔係數量"

完成配對獎勵:
  月費 +2 tokens (本月內有效)
  年費 +4 tokens (本月內有效)

連續達標獎勵 (Streak):
  連續3個月每月至少完成1次配對
  → 第4個月額外送10 tokens
  + 信譽分數+3
```

### 1.4.3 Token額外購買 (7層套裝)

```
| 套裝       | Token | 售價    | 單價    |
|-----------|-------|---------|---------|
| Starter   | 5     | $200    | $40     |
| Basic     | 10    | $380    | $38     |
| Popular ⭐| 50    | $1,750  | $35     |
| Growth    | 100   | $3,200  | $32     |
| Business  | 200   | $5,800  | $29     |
| Scale     | 500   | $13,000 | $26     |
| Enterprise| 1000  | $22,000 | $22     |

首購任何套裝: 額外+10% tokens bonus
(一次性，建立"首次最抵"記憶錨點)
```

### 1.4.4 Token定價邏輯(回本掛鉤)

```
中小forwarder一單運輸GP通常 $1,000-5,000

典型月成本:
  月費 $388 + Basic套裝 $380 = $768

回本門檻:
  $768 ÷ $1,000(最低GP) = 0.77單
  → 即係: 一個月只要成交1單就回本

呢個係Marketing核心訊息:
"平台成本月月唔夠$800
 一張運輸單嘅利潤已經回本
 之後全部係淨賺"
```

## 1.5 Cash Flow多層次收入

```
Layer A: Read-only訂閱 (低價，量大，漏斗)
Layer B: Member訂閱 (主力MRR)
Layer C: Token額外購買 (用量收費)
Layer D: 名額加購 (Surge Pricing,
                   client出多錢加開bid slot)
Layer E: Directory置頂 (Token消耗)
Layer F: 增值服務 (Web/App/ERP開發，
                   高單價低頻次, GP最高)
Layer G: Deposit/Wallet蓄水池 (預收款現金流)
```

## 1.6 預期GP

```
總體GP: 88-92%
主要成本: Supabase/Vercel hosting (~$5K/月)
         Payment processing (~3%)
         Customer support (一人營運初期=0)
```

---

# PART 2 — 防脫媾(Anti-disintermediation)策略

## 2.1 核心原則

> **接受「無法100%防止脫媾」，但要做到「平台價值 > 脫媾收益」**

## 2.2 多層次防護

### Layer A: 漸進式資訊披露 (Progressive Disclosure)

```
階段1 — SR列表(會員可見):
  顯示: 國家級路線、貨類大類、
        貨量範圍(non-exact)、
        目標時間範圍、剩餘bid名額
  隱藏: 確切地址、客戶名稱、確切貨量、
        確切預算、聯絡方式

階段2 — 提交Bid後:
  顯示: 更精確貨量、目標城市
  仍隱藏: 客戶完整身份/聯絡方式

階段3 — 中標後:
  顯示: 全部資料，雙方可開始交易
```

### Layer B: 平台必要設施化

```
平台提供嘅工具，令"跳出去交易"變得麻煩:
  - Quotation生成器
  - Rate Card管理
  - Airway Bill (AWB) 生成
  - 文件管理 (海關文件、保險、PO等)
  - 交易記錄/Paper Trail (對清關糾紛重要)
  - 雙方評分系統 (建立行業聲譽)

→ 用戶習慣咗平台工具，
   "返去用WhatsApp + Excel"係退步
```

### Layer C: Deposit/Wallet 蓄水池機制

```
⚠️ MVP階段建議: 唔做實際資金託管
   (避免PSPLA牌照問題)

改為: "平台信用額度" 概念
  - 用戶儲值入平台 = 換取
    Token額外bonus + 手續費折扣
  - 餘額用嚮平台內任何收費項
  - 唔可以提現
  → 法律性質: 預付服務費，
     唔係儲值支付

→ 用戶有HK$XXXXX未用嚮平台
   = 強烈留低使用嘅理由
```

### Layer D: Community + Reputation 鎖定

```
- 公司Directory曝光 = 行業聲譽建設
- 信譽分數累積 = 唔可帶走嘅資產
- Community貼文歷史 = 個人/公司品牌
- "本月Top Bidder"類badge = 社群地位

→ 唔係阻止用戶走，係令用戶"唔捨得走"
```

### Layer E: Community規則嚴格化

```
Community允許:
  ✅ 公司Showcase Post
  ✅ 行業資訊分享
  ✅ 平台活動參與

Community禁止:
  ❌ Post內直接留聯絡方式
    (Email/WhatsApp/電話)
  ❌ 私訊功能(MVP唔做)
  ❌ 引導用戶去外部平台

技術措施:
  - Post自動過濾敏感字符
    (電話號碼/email regex)
  - 違規貼文自動隱藏 + 通知admin
  - 重複違規 → 帳戶限制
```

---

# PART 3 — 5名額(Agoda式)Scarcity機制

## 3.1 機制設計

```
每個SR有5個bid名額(default)
  - 已用名額即時顯示
  - 進度條視覺化(滿格紅色警示)
  - 截標倒數時鐘
  - 實時"X公司啱啱提交咗bid"通知feed
```

## 3.2 名額已滿後處理

```
情境A — Client角度: 想要更多bid選擇
  → 付費"加開名額"
     (額外1個名額 = $200 或 5 tokens)
     ($收費 vs token，平台收入)

情境B — Forwarder角度: 名額已滿想加入
  → 唔可以(name額已封)
  → 但下次見到類似SR時，系統建議
     "用Priority Bid (2 tokens) 
      確保優先入圍"
```

## 3.3 名額數量動態調整

```
唔係硬性5個，依SR熱門度調整:
  - 預設: 5個
  - 一線城市/高需求路線: 可降到3個
    (增強scarcity)
  - 偏門路線/開發中地區: 可開到
    7-10個 (確保有人bid)

→ 算法基於歷史bid密度自動調整
   (MVP階段可手動by admin)
```

---

# PART 4 — 用戶完整旅程 (User Journey)

```
1. 註冊 → 選會員等級 (Read-only / 月費 / 年費)
   ↓
2. Onboarding Wizard (5步)
   → 公司資料、業務範圍、優勢介紹、
     Quotation範本、生態圈展示
   → 完成後獲7天試用 + 10 tokens
   ↓
3. Dashboard ("今日要做嘅事")
   → 可bid SR (Forwarder角色)
   → 我發出嘅SR (Client角色)
   → 進行中交易 (Progress Bar)
   ↓
4. Action: 發SR (Client) OR Bid SR (Forwarder)
   ↓
5. 配對成立 → 雙方聯絡資料自動雙向解鎖
   ↓
6. 交易進行: Quotation → AWB → 文件管理
            → 標記完成
   ↓
7. 互評 → 信譽分數更新
   ↓
8. 持續使用 → Community發文/睇貼
            → 增值服務考慮
   ↓
9. 累積信譽 → Directory排名上升
            → 更多曝光 → 更多生意
   (正向循環Loop)
```

---

# PART 5 — 系統架構

## 5.1 技術棧

```
Frontend: Next.js 14+ (App Router)
         + Tailwind CSS
         + shadcn/ui
         + Framer Motion (動畫)

Backend: Next.js API Routes / Server Actions
         + Supabase (Postgres + Auth + Storage)
         + Supabase Edge Functions / Vercel Cron

Payment: Stripe (信用卡，自動續費)
        + Airwallex (Phase 2: FPS自動對帳)
        + FPS/PayMe手動confirm (MVP階段)

Notification: Resend (Email)
             + Supabase Realtime (站內通知)

PDF生成: react-pdf (Quotation/AWB)
```

## 5.2 資料庫主要表

詳見 v3 doc Section 13 (沿用，新增以下):

```
sr_quota_usage
  user_id, year_month, quota_used,
  quota_total, last_reset_at

priority_bids
  bid_id, priority_level, token_cost,
  expires_at

community_posts
  id, user_id, content, type
    (showcase/news/discussion),
  attachments(jsonb), is_flagged,
  moderation_status, created_at

community_post_likes / community_post_comments

deposits (Wallet)
  id, user_id, balance_hkd,
  balance_token_bonus, 
  last_topup_at

deposit_transactions
  id, user_id, type(topup/spend/bonus),
  amount, related_intent_id, balance_after

increase_competitiveness_orders
  id, user_id, service_type
    (web/app/erp/custom),
  status, scope_doc_url, quote_amount,
  created_at

bid_slot_purchases
  sr_id, buyer_user_id (Client),
  additional_slots, token_or_hkd_cost,
  created_at
```

## 5.3 API Routes (主要)

```
/api/onboarding/*
/api/shipment-requests/*
  - GET: 列表(Level1/2可見度套用)
  - POST: 建立SR(檢查quota,
                 超額自動扣token)
  - PATCH: 加開bid slot
/api/bids/*
  - POST: 提交bid(submit_bid_with_token RPC,
                  支援priority)
/api/match-records/*
/api/quotations/*
/api/awb/* (Airway Bill generation)
/api/community/*
  - POST: 建立貼文(過濾敏感資訊)
/api/deposits/*
  - POST: 儲值(走payment_intents)
  - GET: 餘額同交易記錄
/api/competitiveness/*
  - POST: 申請增值服務(留低需求,
                       admin跟進報價)
/api/tokens/*
/api/subscriptions/*
/api/directory/*
/api/admin/*
```

## 5.4 Cron Jobs

詳見 backend spec Section A3 (沿用，新增):

```
+ 每月SR配額重置 (每月1日)
+ Community敏感字監察 (每小時)
+ Deposit到期/inactive提醒 (每週)
+ Streak達標檢查 (每月)
```

## 5.5 RPC Functions

詳見 bids/tokens RPC spec (沿用，新增):

```
+ submit_sr_with_quota_check
  (檢查quota，超額自動扣token，
   建立SR，全部atomic)
+ purchase_bid_slot
  (Client加開bid slot嘅扣費邏輯)
+ award_completion_bonus
  (配對完成自動派發token獎勵)
```

---

# PART 6 — 一句總結

```
LBID =
  雙向物流交易所(Client+Forwarder
                  互為角色)
  × 三層會員(Read-only/月費/年費)
  × Token行動貨幣(發SR配額+Bid消耗)
  × 5名額Agoda稀缺感
  × 漸進式資訊披露(防脫媾)
  × Community + Reputation
    (留客嘅情感+功能護城河)
  × 增值服務套裝(終局變現)
  × Deposit蓄水池(現金流+黏性)

  → 形成close loop生態系統:
    用戶開公司 → 平台搵生意
              → 賺到錢
              → 平台幫你做web/app/erp
              → 公司繼續成長
              → 永遠喺呢個生態
```
