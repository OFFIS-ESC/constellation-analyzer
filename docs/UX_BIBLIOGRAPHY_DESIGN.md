# Bibliography System - UX Design Concept

## Executive Summary

This document outlines the UX design for integrating a citation/reference management system into Constellation Analyzer. The design prioritizes ease of use for social scientists who may not be technically versed, while maintaining flexibility for power users.

---

## 1. User Research & Requirements

### Target Users
- **Primary**: Social scientists conducting constellation analyses
- **Technical level**: Low to medium (not LaTeX/BibTeX users)
- **Use case**: Track sources for actors and relationships in their analysis
- **Workflow**: Need quick access to add/edit/cite references without interrupting graph work

### Key Requirements
- Simple, form-based reference entry (not code-based like BibTeX)
- Support common social science citation types (books, articles, websites, reports)
- Quick citation from node/edge properties
- Export capability for academic writing
- Integration with existing document structure

---

## 2. Data Format Decision: CSL-JSON

### Why CSL-JSON over BibTeX?

**CSL-JSON Advantages:**
- ✅ Human-readable JSON format
- ✅ Industry standard (Zotero, Mendeley, Papers)
- ✅ 10,000+ pre-built citation styles available
- ✅ Better support for non-English sources
- ✅ UTF-8 native support
- ✅ Easier to parse and manipulate programmatically
- ✅ Can be converted to/from BibTeX for power users

**BibTeX Limitations:**
- ❌ Complex syntax (`@article{key, field={value}}`)
- ❌ Requires understanding of LaTeX conventions
- ❌ Less intuitive for non-technical users
- ❌ ASCII-focused (problematic for international names)

### CSL-JSON Structure (Simplified)

```json
{
  "id": "unique-id",
  "type": "article-journal",
  "title": "Understanding Social Networks",
  "author": [
    {"family": "Smith", "given": "Jane"},
    {"family": "Doe", "given": "John"}
  ],
  "issued": {"date-parts": [[2023]]},
  "container-title": "Journal of Social Sciences",
  "volume": "45",
  "issue": "3",
  "page": "123-145",
  "DOI": "10.1000/example",
  "URL": "https://example.com/article"
}
```

### Supported Reference Types
1. **article-journal** - Journal articles
2. **book** - Books
3. **chapter** - Book chapters
4. **paper-conference** - Conference papers
5. **report** - Technical reports, white papers
6. **thesis** - Theses and dissertations
7. **webpage** - Web pages and online sources
8. **interview** - Interviews (common in social sciences)
9. **manuscript** - Unpublished manuscripts
10. **personal_communication** - Personal communications

---

## 3. UI Component Design

### 3.1 Access Points

**Primary Access: Menu Bar**
```
Edit Menu:
├── Configure Actor Types
├── Configure Relation Types
├── Configure Labels
├── [NEW] Manage Bibliography    (Ctrl+B)
```

**Secondary Access: Property Panels**
- Add "Citations" field to Node Editor Panel
- Add "Citations" field to Edge Editor Panel

**Tertiary Access: Export Menu**
```
File → Export → Bibliography (CSL-JSON)
File → Export → Bibliography (BibTeX)  [for power users]
File → Export → Formatted Bibliography (HTML/PDF)
```

---

### 3.2 Bibliography Management Modal

**Layout: Two-Column Design** (consistent with existing Label/Type config modals)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Manage Bibliography                                          [X]    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────┬──────────────────────────────────┐   │
│  │  Quick Add Reference     │  Your References (15)            │   │
│  │  (60% width)             │  (40% width)                     │   │
│  │                          │                                  │   │
│  │  [Reference Type ▼]      │  ┌─────────────────────────────┐│   │
│  │   ○ Journal Article      │  │ Smith & Doe (2023)          ││   │
│  │   ○ Book                 │  │ Understanding Social...      ││   │
│  │   ○ Website              │  │ Journal of Social Sciences   ││   │
│  │   ○ Other...             │  │ [Edit] [Delete] [Cite]      ││   │
│  │                          │  └─────────────────────────────┘│   │
│  │  Smart Input:            │                                  │   │
│  │  ┌─────────────────────┐ │  ┌─────────────────────────────┐│   │
│  │  │ Paste DOI, URL, or  │ │  │ Johnson (2022)              ││   │
│  │  │ formatted citation  │ │  │ Network Theory in...        ││   │
│  │  └─────────────────────┘ │  │ Academic Press              ││   │
│  │  [Auto-Fill] [Clear]     │  │ [Edit] [Delete] [Cite]      ││   │
│  │                          │  └─────────────────────────────┘│   │
│  │  -- OR Manual Entry --   │                                  │   │
│  │                          │  [Search references...]         │   │
│  │  Title *                 │  Filter: [All Types ▼]          │   │
│  │  ┌─────────────────────┐ │                                  │   │
│  │  │                     │ │  Sort by: [Recent ▼]            │   │
│  │  └─────────────────────┘ │                                  │   │
│  │                          │                                  │   │
│  │  Authors (one per line)  │                                  │   │
│  │  ┌─────────────────────┐ │                                  │   │
│  │  │ Jane Smith          │ │                                  │   │
│  │  │ John Doe            │ │                                  │   │
│  │  └─────────────────────┘ │                                  │   │
│  │                          │                                  │   │
│  │  Year *                  │                                  │   │
│  │  ┌────┐                  │                                  │   │
│  │  │2023│                  │                                  │   │
│  │  └────┘                  │                                  │   │
│  │                          │                                  │   │
│  │  [+ Show More Fields]    │                                  │   │
│  │                          │                                  │   │
│  │  [Add Reference]         │                                  │   │
│  └──────────────────────────┴──────────────────────────────────┘   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 💡 Tip: Paste a DOI or URL for automatic citation import    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│                                    [Import File] [Close]             │
└─────────────────────────────────────────────────────────────────────┘
```

**Edit Mode: Full-Width** (when editing existing reference)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Edit Reference                                               [X]    │
├─────────────────────────────────────────────────────────────────────┤
│  ← Back to List                                                      │
│                                                                       │
│  Reference Type: [Journal Article ▼]                                │
│                                                                       │
│  Title *                                                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Understanding Social Networks in Constellation Analysis      │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  Authors (one per line or separated by semicolons) *                │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Jane Smith; John Doe                                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  Year * [2023]  Volume [45]  Issue [3]  Pages [123-145]             │
│                                                                       │
│  Journal/Container Title                                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Journal of Social Sciences                                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  DOI (Optional)                  URL (Optional)                      │
│  ┌───────────────────────────┐  ┌───────────────────────────────┐  │
│  │ 10.1000/example           │  │ https://example.com/article   │  │
│  └───────────────────────────┘  └───────────────────────────────┘  │
│                                                                       │
│  Abstract/Notes (Optional)                                           │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                                                               │  │
│  │                                                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  Tags (comma separated)                                              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ social networks, methodology, qualitative                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ Preview:                                                     │    │
│  │ Smith, J., & Doe, J. (2023). Understanding Social Networks  │    │
│  │   in Constellation Analysis. Journal of Social Sciences,    │    │
│  │   45(3), 123-145. https://doi.org/10.1000/example           │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  Citation Format: [APA 7th ▼]                                        │
│                                                                       │
│                                        [Cancel] [Save Changes]       │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 3.3 Citation Field in Property Panels

**Node Editor Panel - Add "Citations" Section** (after Labels, before Connections)

```
┌───────────────────────────────┐
│ Actor Properties              │
├───────────────────────────────┤
│ Actor Type: [Researcher ▼]   │
│ Label: Jane Smith             │
│ Description: ...              │
│ Labels: [methodology]         │
│                               │
│ Citations (2)                 │
│ ┌───────────────────────────┐ │
│ │ • Smith & Doe (2023)      │ │
│ │ • Johnson (2022)          │ │
│ │ [+ Add Citation]          │ │
│ └───────────────────────────┘ │
│                               │
│ Connections (3)               │
│ ...                           │
└───────────────────────────────┘
```

**Citation Selection Dropdown**

When user clicks [+ Add Citation]:

```
┌───────────────────────────────────┐
│ Add Citation                      │
├───────────────────────────────────┤
│ Search references...              │
│ ┌───────────────────────────────┐ │
│ │ 🔍 smith                      │ │
│ └───────────────────────────────┘ │
│                                   │
│ Results (2):                      │
│ ┌───────────────────────────────┐ │
│ │ ☑ Smith & Doe (2023)          │ │
│ │   Understanding Social...     │ │
│ │   J. Social Sciences          │ │
│ ├───────────────────────────────┤ │
│ │ ☐ Smithson (2021)             │ │
│ │   Network Analysis Methods    │ │
│ │   Academic Press              │ │
│ └───────────────────────────────┘ │
│                                   │
│ [+ Create New Reference]          │
│                                   │
│              [Cancel] [Add (1)]   │
└───────────────────────────────────┘
```

**Features:**
- Multi-select checkbox list
- Real-time search filtering
- Shows abbreviated citation info
- Quick create if reference doesn't exist
- Selected references show checkmarks

---

### 3.4 Reference Card Design (in Management List)

```
┌─────────────────────────────────────────────┐
│ Smith & Doe (2023)                 [📋][✏️][🗑️] │
│ Understanding Social Networks in...         │
│ Journal of Social Sciences                  │
│ ─────────────────────────────────────────── │
│ 🏷️ social networks, methodology             │
│ 📊 Cited by: 3 actors, 2 relations          │
└─────────────────────────────────────────────┘
```

**Card Components:**
1. **Header**: Short citation (Author-Date)
2. **Title**: Truncated with ellipsis
3. **Container**: Journal/Book/Website name
4. **Tags**: Visual tag chips
5. **Usage**: Count of actors/relations citing this
6. **Actions**: Copy citation, Edit, Delete

---

## 4. User Workflows

### 4.1 Workflow: Quick Add Reference (Smart Import)

**Scenario**: User has a DOI or formatted citation

1. Open "Manage Bibliography" (Ctrl+B or Edit menu)
2. Paste DOI/URL in "Smart Input" field
3. Click "Auto-Fill"
4. System fetches metadata and populates fields
5. User reviews/adjusts if needed
6. Click "Add Reference"
7. Toast: "Reference added successfully"

**Fallback**: If auto-fill fails, form remains with manual entry option

---

### 4.2 Workflow: Manual Reference Entry

**Scenario**: User has a book without DOI

1. Open "Manage Bibliography"
2. Select reference type: "Book"
3. Form adjusts to show relevant fields:
   - Title, Authors, Year (required)
   - Publisher, Place, ISBN, Pages (optional)
4. Fill in required fields
5. Click "Add Reference"
6. Reference appears in list on right

---

### 4.3 Workflow: Cite Reference in Node

**Scenario**: User wants to cite sources for an actor

1. Select node in graph
2. Right panel shows Node Editor
3. Scroll to "Citations" section
4. Click [+ Add Citation]
5. Search dropdown appears
6. Type to filter or browse list
7. Check box(es) for desired reference(s)
8. Click "Add"
9. Citations appear as bullet list with author-date
10. Change auto-saves after 500ms debounce

---

### 4.4 Workflow: Edit Existing Reference

**Scenario**: User needs to correct publication year

1. Open "Manage Bibliography"
2. Find reference in right column list
3. Click [Edit] button
4. Modal switches to full-width edit mode
5. Modify year field
6. Preview updates in real-time
7. Click "Save Changes"
8. Returns to two-column view
9. Toast: "Reference updated"

**Note**: All actors/relations citing this reference show updated info

---

### 4.5 Workflow: Delete Reference with Usage

**Scenario**: User deletes reference cited by 5 items

1. Click [Delete] on reference card
2. Confirmation dialog appears:
   ```
   Delete Reference?

   This reference is cited by:
   • 3 actors
   • 2 relations

   Deleting will remove all citations to this reference.

   [Cancel] [Delete Reference]
   ```
3. User confirms
4. Reference deleted from bibliography
5. All citation links removed from actors/relations
6. Toast: "Reference deleted"

---

### 4.6 Workflow: Export Bibliography

**Scenario**: User wants formatted bibliography for paper

1. File → Export → Formatted Bibliography
2. Dialog appears:
   ```
   Export Bibliography

   Format: [APA 7th Edition ▼]

   Options:
   ☑ Include only cited references
   ☐ Include all references
   ☑ Sort alphabetically by author

   Output:
   ○ HTML (for web/Word)
   ○ PDF
   ○ Plain text

   [Cancel] [Export]
   ```
3. User selects options
4. Click "Export"
5. File save dialog
6. Toast: "Bibliography exported successfully"

---

## 5. Design Principles

### 5.1 Progressive Disclosure
- **Basic mode**: Show only essential fields (Title, Author, Year)
- **Advanced mode**: "Show More Fields" reveals DOI, ISBN, Volume, etc.
- **Smart defaults**: Type selection pre-fills appropriate fields

### 5.2 Forgiveness & Flexibility
- **Auto-save**: No manual save needed (consistent with current app)
- **Undo support**: Bibliography changes tracked in history
- **Validation**: Soft validation (warnings, not errors)
- **Import/Export**: Allow bulk operations for power users

### 5.3 Consistency with Existing Patterns
- **Modal layout**: Two-column → Full-width (like Labels/Types)
- **Toast notifications**: All actions get feedback
- **Confirmation dialogs**: Destructive operations require confirmation
- **Debounced updates**: 500ms delay for citation assignments
- **Color coding**: None needed (unlike types), but tags use label-like chips

### 5.4 Social Science Focus
- **Citation preview**: Always show formatted citation (APA/Chicago/MLA)
- **Interview type**: Support non-traditional sources
- **Qualitative notes**: Abstract field for researcher notes
- **Tagging**: Organize by themes, not just bibliographic categories

---

## 6. Technical Considerations

### 6.1 Data Storage

**Document Structure** (extend ConstellationDocument):
```typescript
export interface ConstellationDocument {
  // ... existing fields
  bibliography?: {
    references: BibliographyReference[];
    settings?: {
      defaultStyle: string;  // e.g., "apa-7th"
      sortOrder: 'author' | 'year' | 'title';
    }
  }
}
```

**Node/Edge Structure** (extend ActorData/RelationData):
```typescript
export interface ActorData {
  // ... existing fields
  citations?: string[];  // Array of reference IDs
}

export interface RelationData {
  // ... existing fields
  citations?: string[];  // Array of reference IDs
}
```

### 6.2 Import/Export

**Supported Formats:**
1. **CSL-JSON** (primary)
   - Native format
   - Import from Zotero, Mendeley
   - Export for use in other tools

2. **BibTeX** (secondary, for power users)
   - Convert CSL-JSON ↔ BibTeX
   - Use existing libraries (citation-js, bibtex-parser)

3. **RIS** (tertiary, for compatibility)
   - Common in older reference managers
   - Convert via citation-js

4. **Formatted HTML/PDF**
   - For inclusion in papers/reports
   - Use CSL processor (citeproc-js)

### 6.3 Auto-Fill Service

**DOI Lookup**:
- Use CrossRef API (free, no auth required)
- Endpoint: `https://api.crossref.org/works/{doi}`
- Returns JSON metadata

**URL Metadata**:
- Use Open Graph tags or Dublin Core metadata
- Fallback to page title/author extraction
- Not as reliable as DOI

**Fallback**:
- If lookup fails, show error toast
- Keep form populated with what was entered
- Allow manual completion

### 6.4 Citation Style Library

**Approach**: Use Citation Style Language (CSL)

**Libraries**:
- `citeproc-js`: CSL processor for formatting
- `citation-js`: Parse/convert between formats
- Preload common styles: APA 7th, Chicago, MLA, Harvard

**Style Switching**:
- User can change preview style in modal
- Setting saved per document
- All citations reformat instantly

---

## 7. Accessibility & Usability

### 7.1 Keyboard Navigation
- `Ctrl+B`: Open bibliography modal
- `Tab`: Navigate between fields
- `Enter`: Submit forms (add/save)
- `Esc`: Close modal/cancel
- `/` in search: Focus search input

### 7.2 Screen Reader Support
- Form labels with `aria-label`
- Button descriptions
- Status announcements for actions
- Semantic HTML (fieldset, legend, label)

### 7.3 Visual Design
- **High contrast**: Readable citation text
- **Clear hierarchy**: Title > Authors > Container
- **Action buttons**: Icon + text for clarity
- **Tooltips**: Help text for advanced fields

---

## 8. Future Enhancements (Not MVP)

### Phase 2
- **Duplicate detection**: Warn if similar reference exists
- **Citation count**: Show most/least cited references
- **Bulk import**: CSV, BibTeX file upload
- **Collaboration**: Shared bibliography across workspace
- **Citation network**: Graph of which references cite each other

### Phase 3
- **PDF import**: Drag PDF, extract citation
- **Web clipper**: Browser extension for one-click import
- **Smart suggestions**: Recommend related references
- **Citation graph**: Visualize citation relationships as constellation
- **Integration**: Export to LaTeX/Word with in-text citations

---

## 9. Success Metrics

### User Experience
- ✅ Non-technical users can add reference in <2 minutes
- ✅ 90% of DOI lookups succeed automatically
- ✅ Zero training needed (intuitive interface)
- ✅ No "Save" button confusion (auto-save)

### Technical
- ✅ Bibliography data persists with document
- ✅ Import/export works with Zotero/Mendeley
- ✅ No performance impact on graph rendering
- ✅ Undo/redo works for bibliography changes

### Adoption
- ✅ Users cite at least 1 reference per document
- ✅ Bibliography modal opened in >50% of sessions
- ✅ Export feature used by academic users

---

## 10. Implementation Phases

### Phase 1: Core Functionality (MVP)
1. Bibliography modal (two-column layout)
2. CRUD operations (Create, Read, Update, Delete)
3. Basic CSL-JSON storage
4. Citation field in node/edge properties
5. Simple formatted preview (APA only)
6. Export as CSL-JSON

### Phase 2: Smart Features
1. DOI auto-fill
2. Multiple citation styles (APA, Chicago, MLA)
3. Import from BibTeX
4. Export formatted bibliography (HTML)
5. Tag filtering and search
6. Usage tracking (citation counts)

### Phase 3: Power User Features
1. Bulk operations
2. Advanced search/filter
3. Custom citation styles
4. PDF import
5. Duplicate detection
6. Citation graph visualization

---

## Conclusion

This design balances simplicity for non-technical social scientists with power features for advanced users. By using CSL-JSON as the underlying format, we ensure compatibility with popular reference managers while keeping the UI approachable. The two-column modal pattern maintains consistency with existing app design, reducing the learning curve.

**Key Innovation**: Smart input field that accepts DOI/URL and auto-fills, dramatically reducing manual entry burden while still allowing full manual control.

**Next Steps**: Create technical specification and begin implementation with Phase 1 (MVP).