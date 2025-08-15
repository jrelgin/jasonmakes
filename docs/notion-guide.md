## Notion → Next docs (developer quick-sheet)

### Architecture snapshot  
| Layer | Lib / approach | Why we chose it |
|-------|----------------|-----------------|
| **Database search** | `@notionhq/client` (official SDK) | Full query support, uses low-privilege *integration token*. |
| **Page + block fetch** | Official SDK + small recursive helper (`lib/notionRecordMap.ts`) | Keeps same token; avoids `notion-client`'s cookie requirement. |
| **RecordMap conversion** | Custom mapper in `lib/mapBlocksToRecordMap.ts` | The `notion-compat` helper was removed in react-notion-x ≥ 7.3, so we alias block names and inject `properties.title` ourselves. |
| **Rendering** | `react-notion-x` (Client Component wrapper) | Mature renderer, SSR-friendly; only needs `recordMap.block`. |

### Key "polyfills" we added
1. **Recursive child fetch** – official API returns children one level at a time.  
   → `getRecordMap()` loops until `has_more` is false and recurses into nested blocks.

2. **Legacy block aliases**  
paragraph            → text
heading_1,2,3        → header, sub_header, sub_sub_header
bulleted_list_item   → bulleted_list
numbered_list_item   → numbered_list
to_do                → todo
Without these, react-notion-x logs *"Unsupported block type"*.

3. **`properties.title` shim** – react-notion-x expects every text-like block to expose its rich-text as `properties.title`. We map the API's `rich_text[]` into that shape (with basic bold / italic flags).

### **Current Implementation Status (Updated)**

#### **Content Caching:**
- **Development**: 5-minute cache with `unstable_cache` and `'post'` tag
- **Production**: Manual cache invalidation only (`revalidate: false`)
- **No persistent storage** - content fetched live from Notion on every request
- **Cache tags**: Uses `'post'` tag for manual revalidation

#### **Image Handling:**
- **Current**: Proxy approach via `/api/notion-image` route
- **Problem**: Still fetches from expiring Notion S3 URLs, just through proxy
- **No persistent storage** - images break when Notion rotates URLs
- **Cache headers**: 1-year cache on proxy responses, but source URLs expire

#### **Revalidation Workflow:**
- **Webhook**: `POST /api/refresh-content?secret=REVALIDATION_TOKEN&path=/`
- **Action**: Clears Next.js cache for specified paths
- **Trigger**: Manual "Publish" button in Notion (likely triggers Vercel deploy)
- **Result**: Fresh content fetched on next request

### **Implementation Plan: Enhanced Image Caching + Content Persistence**

#### **Phase 1: Smart Image Versioning with Vercel Blob Storage**

1. **Install Dependencies:**
   ```bash
   pnpm add @vercel/blob
   ```

2. **Environment Variables (add to Vercel):**
   ```bash
   BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
   ```

3. **Enhanced Image Proxy (`/api/notion-image`):**
   - **Versioning Strategy**: `notion-images/{pageId}/{blockId}/{lastEditedTime}.jpg`
   - **Smart Caching**: Check blob storage first, fallback to Notion fetch + upload
   - **Update Detection**: Use Notion block `last_edited_time` for versioning
   - **Automatic Cleanup**: Background job to remove orphaned image versions

4. **Image Storage Flow:**
   ```
   Request → Check blob storage → If exists & current → Serve
           → If not exists or outdated → Fetch from Notion → Upload to blob → Serve
   ```

#### **Phase 2: Static Content Generation (Simplified Approach)**

1. **Build-Time Content Generation:**
   - Fetch content from Notion during build/deploy
   - Generate static HTML pages and commit to repo
   - Images reference permanent blob storage URLs

2. **Static File Strategy:**
   - **Articles/Case Studies**: Pre-generated static pages
   - **Images**: Stored in blob storage with permanent URLs
   - **Dynamic content**: Continues to use existing patterns

3. **Content Generation Flow:**
   ```
   Deploy → Fetch from Notion → Generate static pages → Commit to repo → Serve statically
   ```

4. **Benefits of Static Approach:**
   - ✅ **Fastest possible**: Static files served from CDN edge
   - ✅ **Version controlled**: Content changes tracked in git
   - ✅ **Zero runtime cost**: No database calls or processing
   - ✅ **Reliable**: Static files can't break
   - ✅ **Simple**: No complex caching logic needed

#### **Benefits of Enhanced Solution:**

- ✅ **No More Broken Images**: Permanent blob storage with smart versioning
- ✅ **Fastest Page Loads**: Static files + blob storage for images
- ✅ **Handles Updates**: Automatic detection and storage of new image versions
- ✅ **Cost Optimized**: Static files are free, minimal blob storage costs
- ✅ **Deploy Compatible**: Works with existing Notion publish workflow
- ✅ **Simple & Reliable**: Static content + permanent image storage

#### **Migration Strategy:**

1. **Deploy Phase 1** (image blob storage) first - solves immediate image issues
2. **Deploy Phase 2** (static content generation) - optional performance optimization
3. **Monitor & Optimize** - track blob storage costs and cleanup efficiency

### **Future wishlist**
* **Official "include_children" flag** – would let us delete the recursion code.  
* **Stable `notion-compat` helper** or API-native recordMap endpoint → remove our mapper.  
* **Native Notion webhooks per page/database** – could replace the manual Publish button.
* **Notion integration webhooks** - automatic content updates without manual publish button

> For any renderer breakage (new Notion block types), update the alias table or add a custom component in `NotionClient.tsx`.