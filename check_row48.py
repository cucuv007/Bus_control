import openpyxl

wb = openpyxl.load_workbook(r'C:\Users\utkuesin.kurucu\Downloads\15_DC15_2025_09_13.xlsx')
ws = wb.active

print("Row 48 analizi:\n")

white_count = 0
non_white_count = 0

for i in range(4, 19):
    cell = ws.cell(48, i)
    col_letter = chr(64 + i)
    
    is_white = False
    if cell.font and cell.font.color and hasattr(cell.font.color, 'theme'):
        theme = cell.font.color.theme
        tint = cell.font.color.tint if hasattr(cell.font.color, 'tint') else 0
        is_white = (theme == 0 and tint >= 0)
    
    if is_white:
        white_count += 1
        print(f"{col_letter}48: WHITE - {cell.value}")
    else:
        non_white_count += 1
        print(f"{col_letter}48: NORMAL - {cell.value}")

print(f"\nWhite cells: {white_count}")
print(f"Normal cells: {non_white_count}")
print(f"Total: {white_count + non_white_count}")
