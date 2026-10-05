# export-excel.md — Standard Excel Export Skill

> **Skill Name:** `export-excel`  
> **Purpose:** Maintain and verify the 25-column standardized Excel report template in Visitor Admin.

---

## 1. Authoritative 25-Column Template Specification

File: `src/app/visitoradmin/page.tsx` (`handleExportExcel`)

The exported `.xlsx` file must contain these exact columns in this exact sequence:

```
1. Request Code          (e.g., E01102603 - no '#' symbol)
2. Visitor Code          (e.g., E01102603V1 - no '#' or '-' symbols)
3. Visitor Name
4. Visitor Title
5. Visitor Company
6. Submitter Name
7. Submitter Department
8. Start Date            (Formatted 'dd/mm/yyyy' vi-VN)
9. End Date              (Formatted 'dd/mm/yyyy' vi-VN)
10. Visitor Category
11. Purpose Of Visit
12. Purpose Detail
13. Visiting Site        (SHTP or DDK)
14. BU                   (Milwaukee / Share Function)
15. Host Functional Dept
16. Func Host Name
17. Host Department
18. Dept Host Name
19. Cost Center
20. Factory Tour         (Yes / No)
21. Meal Registration
22. Status               (COMPLETE, APPROVED, PENDING, REJECTED)
23. Approval Progress    ([STATUS] Room/Host (approver@ttigroup.com.vn))
24. Submit Date          (Formatted 'hh:mm:ss dd/mm/yyyy' vi-VN)
25. Completion Date      (Formatted 'dd/mm/yyyy' vi-VN)
```

---

## 2. Formatting Rules

1. **Header Row Styling:**
   - Background Color: Milwaukee Red (`#DB011C` / ARGB: `FFDB011C`)
   - Text Font: White (`#FFFFFF`), Bold
   - Row Height: `24`
   - Frozen header view enabled (`{ state: 'frozen', xSplit: 0, ySplit: 1 }`)
2. **Column Width Calculation:**
   - Dynamic width based on key length: `Math.max(20, key.length + 5)`
