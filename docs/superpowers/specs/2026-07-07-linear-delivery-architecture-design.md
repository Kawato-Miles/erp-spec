# Linear 交付文件架構收斂設計

日期：2026-07-07
狀態：Miles 核可（本次對話逐段確認）
適用：linear-delivery skill 與 delivery-template（v1.9 起）

## 問題

交付文件迭代數輪後內容發散：Project 描述過厚（操作動線、實作規格、職能分工全塞在 What 層）、各區塊顆粒與命名各自為政、設計過程的對比語言（「合一」「統一」）滲入本體。需要從架構層定義清楚四層文件各放什麼。

## 四層內容正本分工

| 層 | 承載 | 讀者 |
|----|------|------|
| wiki（BRD） | 商業內容正本：商業目標、痛點、業務規則背景、角色、情境、欄位、狀態列舉 | PM＋開發（可查閱） |
| OpenSpec spec（PRD） | 功能行為正本：Requirement／Scenario 完整規則 | PM 內部，不外露 |
| Linear Project | 薄的功能目錄＋商業脈絡：概述與 Use Case 從 wiki 取材、Feature 商業邏輯與驗收從 spec 精簡轉譯 | 開發（What 層） |
| Linear Issue | 實作範圍與具體工作：DE 票＝操作方式與 UI／UX、FE 票＝前端實作（含介面行為細節）、BE 票＝後端實作（含演算法、欄位、事件） | 各職能（How 層） |

## Project 描述結構

1. 概述：商業目標＋現行問題與痛點（源 wiki 痛點卡與商業邏輯卡）
2. Use Case：業務敘事，可跨 project 講完整業務故事（源 wiki 情境）
3. Key Feature：Scope（主要功能／次要功能巢狀）＋ Out of Scope（標歸屬）
4. 各 Key Feature 章：一句描述 → Function 節（僅商業邏輯＋驗收條件兩段；單 Function 的 Feature 不另立 Function 標題）
5. 另案處理、狀態機

移除：操作方式（→ DE 票）、主要動線、Design／FE／BE 區塊、票號對照。

層級：Project（平台 × 模組）→ Key Feature（交付顆粒，對應 spec 一至多個 Requirement）→ Function（觸發顆粒：一種人工操作或系統觸發）→ Issue（職能實作）。

## 書寫原則

1. 白話完整句，業務主管唸得順；不用「術語標籤＋符號壓縮」條目。
2. 只寫現在式的「系統是什麼」；禁設計對比語言（合一、統一、取代、不再、原本）——那是設計討論的差異語言，讀者沒有對照組。
3. 商業規則留 Project、實作規格下放票：介面呈現與互動 → DE／FE 票；演算法細節、欄位、事件結構 → BE 票。
4. 規則本體只在一處，他處一句引用。

## 票結構

- DE 票：每個有介面的 Feature 一張，承載操作動線、畫面流程、UI／UX 要求（開票依規：先 PM team 再轉 Design team）
- FE／BE 票：實作 checklist；概述指回 Project「Key Feature > Function」
- Function 與票名用功能本名，不帶設計過程的對比修飾

## 執行順序

1. 本設計文件 commit
2. delivery-template v1.9
3. 中台－審稿管理重排（描述瘦身＋新開 3 張 DE 票＋既有 5 票指向更新）→ Miles 驗收
4. 套用審稿平台－審稿管理、業務平台－訂單管理

## 被否決的方案（防重踩）

- 驗收條件下放到各票：跨端驗收（同一結果涉及 FE＋BE）沒有單一去處，否決
- Project 只留 Feature 目錄、規則全下放：開發者要跨多張票拼湊規則全貌、規則重複風險回升，否決
- 共用規則節：檢驗後「無家規則」為空集合（免審、活動紀錄皆可成 Feature），例外區塊徒增歸屬判斷成本，否決
