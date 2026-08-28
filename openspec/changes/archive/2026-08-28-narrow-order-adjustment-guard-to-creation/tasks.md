## 1. 主 spec 前言對齊

- [x] 1.1 改 `openspec/specs/order-adjustment/spec.md` § Purpose：「確認可執行」（終態、不可逆）改為「不是終態、業務主管仍可取消」。驗證：該檔 Purpose 段搜「終態、不可逆」無命中。
- [x] 1.2 同檔 § Purpose 補一句建立分流與狀態推進的分界。驗證：Purpose 段可讀出「建立看訂單狀態、推進不看」。

## 2. delta 併回主 spec

- [x] 2.1 執行 archive，把 `order-adjustment` 與 `consultation-request` 兩份 delta 併回主 spec。驗證：主 spec 出現四分支表格與「狀態推進 SHALL NOT 檢查所屬訂單的狀態」。
- [x] 2.2 併回後 `openspec validate --specs` 全部通過。

## 3. 三方一致性檢查

- [x] 3.1 對照 wiki 訂單異動規則 § 狀態推進不依訂單狀態 與併回後的 spec，兩邊說法一致。
- [x] 3.2 確認 `after-sales-ticket` spec 未與本次四分支衝突（該 spec 的建單前提為終態訂單，與分支二相容）。
- [x] 3.3 全 `openspec/specs/` 搜「SHALL NOT 以訂單狀態 disabled」「只是建議」，確認無殘留。
