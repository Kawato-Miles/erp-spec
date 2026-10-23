## Why

### Background

裝箱資料的長、寬、高依箱規帶入，規則正本見 wiki [出貨單](../../../memory/Sens_wiki/wiki/erp/05-entities/出貨單.md) § 裝箱資料「長、寬、高的帶入」與 § 箱規（系統設定）。拍板見同資料夾 [grill.md](grill.md)（G60～G62）。

### Problem Statement

前一個 change 讓沒有尺寸的箱規（如 K1 箱）長寬高可手填，且帶入規則把「改選箱規」限定在修正時。Miles 拍板：箱規照主檔顯示，選箱規時一律照箱規帶入並鎖住，箱規沒記的欄位空白；只有「自訂」可手填。

## What Changes

### New Capabilities

（無）

### Modified Capabilities

- shipment：「箱規選擇與長寬高帶入」改為選箱規一律照箱規帶入並鎖住；改寫沒有尺寸箱規與修正時改箱規兩條驗收條目

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- shipment：箱規帶入規則改為照箱規、只有自訂可手填

## Impact

- Prototype：qc-shipping 裝箱回報與裝箱回報修正對話框的長寬高鎖定
- 測試：情境目錄 12.44 與對應單元、畫面測試
