
import sys

with open('style.css', 'r') as f:
    lines = f.readlines()

# Second version starts where themes start or where .app-container starts again.
# [data-theme="nordic"] starts at line 2481.
second_version_start = -1
for i, line in enumerate(lines):
    if '[data-theme="nordic"] {' in line and i > 100:
        second_version_start = i
        break

if second_version_start == -1:
    # Fallback to .app-container
    for i, line in enumerate(lines):
        if '.app-container {' in line and i > 2000:
            second_version_start = i
            break

if second_version_start != -1:
    print(f"Found second version start at line {second_version_start + 1}")
    # Keep lines from start to line 93 (before first .app-container)
    # Actually, keep lines 1 to 75 (before first * {)
    new_lines = lines[:75] + lines[second_version_start:]
    with open('style.css', 'w') as f:
        f.writelines(new_lines)
    print("Deduplicated style.css correctly")
else:
    print("Could not find second version start")
