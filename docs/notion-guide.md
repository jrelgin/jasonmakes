## Notion → Next docs (developer quick-sheet)

### Architecture snapshot  
| Layer | Lib / approach | Why we chose it |
|-------|----------------|-----------------|
| **Database search** | `@notionhq/client` (official SDK) | Full query support, uses low-privilege *integration token*. |
| **Page + block fetch** | Official SDK + small recursive helper (`lib/notionRecordMap.ts`) | Keeps same token; avoids `notion-client`’s cookie requirement. |
| **RecordMap conversion** | Custom mapper in `lib/mapBlocksToRecordMap.ts` | The `notion-compat` helper was removed in react-notion-x ≥ 7.3, so we alias block names and inject `properties.title` ourselves. |
| **Rendering** | `react-notion-x` (Client Component wrapper) | Mature renderer, SSR-friendly; only needs `recordMap.block`. |

### Key “polyfills” we added
1. **Recursive child fetch** – official API returns children one level at a time.  
   → `getRecordMap()` loops until `has_more` is false and recurses into nested blocks.

2. **Legacy block aliases**  
paragraph            → text
heading_1,2,3        → header, sub_header, sub_sub_header
bulleted_list_item   → bulleted_list
numbered_list_item   → numbered_list
to_do                → todo
Without these, react-notion-x logs *“Unsupported block type”*.

3. **`properties.title` shim** – react-notion-x expects every text-like block to expose its rich-text as `properties.title`. We map the API’s `rich_text[]` into that shape (with basic bold / italic flags).

### Publish workflow
* **Notion Button → Webhook**  
`POST /api/refresh-content?secret=REVALIDATION_TOKEN&path=/`  
* **API route** validates the secret and runs `revalidateTag('post')`.  
* Pages fetch data with `next:{ tags:['post'] }`; first request after the webhook regenerates.

### Future wishlist
* **Official “include_children” flag** – would let us delete the recursion code.  
* **Stable `notion-compat` helper** or API-native recordMap endpoint → remove our mapper.  
* **Native Notion webhooks per page/database** – could replace the manual Publish button.

> For any renderer breakage (new Notion block types), update the alias table or add a custom component in `NotionClient.tsx`.