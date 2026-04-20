## MODIFIED Requirements

### Requirement: QC 角色編輯限制

QC 角色 SHALL 擁有工單模組的 R/W 權限，但可編輯範圍 MUST 限於 QC 紀錄，不可修改工單其他內容。QC 單的建立動作 MUST 由印務執行，QC 角色僅能執行已建立的 QC 單、填寫結果並提交；QC 單生命週期詳見 [qc capability § QC 角色權限邊界](../qc/spec.md)。

#### Scenario: QC 人員記錄檢驗結果

WHEN QC 角色開啟工單的品質檢驗頁面
THEN 系統 SHALL 提供 QC 紀錄填寫介面
AND QC 角色 SHALL 可記錄檢驗結果、異常描述與處理方式
AND MUST NOT 允許修改工單的製程、數量或排程等欄位
AND MUST NOT 允許建立新 QC 單（QC 單建立權屬印務）
