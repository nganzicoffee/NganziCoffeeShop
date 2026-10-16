# Nganzi Coffee: Brand & Site Structure

**Purpose:** Architecture and specifications for the unified Nganzi Coffee website, ecommerce store, and sales-management system in Laravel.  
**Domain:** `nganzicoffee.com` (and `www.nganzicoffee.com`)  
**Admin:** `nganzicoffee.com/admin`

## 1. Brand foundation

Nganzi Coffee is a Ugandan coffee business connecting quality coffee to the people and places behind it. Its story is rooted in Uganda, farmer relationships, careful processing, traceable origins, and the journey from farm to cup. The name “Nganzi” is a Lutooro word meaning “beloved” or “something great.”

The platform combines the brand story, marketing pages, full ecommerce shopping experience, and staff management into one cohesive application.

### Brand voice

- Warm and welcoming, with a strong sense of place.
- Clear and confident about coffee, flavour, origin, and product details.
- People-centred: recognize growers, partners, and communities without making unsupported claims.
- Use short, plain-language calls to action such as **Shop coffee**, **Add to basket**, and **Continue to checkout**.
- Keep the existing story cues where appropriate: “From Uganda, with purpose,” “Rooted in Uganda,” and “from origin to cup.”

### Visual direction

Match the established brand visual identity:

| Use                       | Existing direction     |
| ------------------------- | ---------------------- |
| Primary accent            | Warm orange `#F29520`  |
| Hover accent              | Deep orange `#D9780D`  |
| Main dark                 | Coffee brown `#38261E` |
| Supporting brown          | `#624638`              |
| Warm background           | Cream `#FFF8EE`        |
| Secondary warm background | Peach `#FCECDD`        |
| Main text                 | `#332A25`              |
| Muted text                | `#756C64`              |
| Borders                   | `#E4DBCF`              |
| Headings                  | DM Sans, bold          |
| Body                      | Manrope                |
| Occasional script accent  | Caveat, used sparingly |

Prefer generous whitespace, editorial photography, clear product imagery, simple layouts, and mostly square-cornered controls. Use the existing Nganzi logo, coffee packaging, roast imagery, Ugandan landscapes, and farm/production photography where suitable. Maintain readable contrast and accessible type sizes. On mobile, keep product discovery and checkout especially direct.

## 2. Domain and unified site structure

The entire application runs at **`nganzicoffee.com`**:

- **`nganzicoffee.com/`**: Public homepage and brand story
- **`nganzicoffee.com/coffee` & `/about` & `/contact`**: Marketing and educational content
- **`nganzicoffee.com/shop` & `/cart` & `/checkout`**: Ecommerce storefront
- **`nganzicoffee.com/admin`**: Staff-only sales, order, inventory, and analytics dashboard

Consider an `admin.nganzicoffee.com` hostname later only if there is a concrete need to isolate administration operationally—for example, a separately deployed admin application, stricter network access controls, or a distinct operations team. If introduced, it still needs strong server-side authorization and secure session configuration.

## 3. Storefront structure

### Recommended customer journey

**Home → Product listing → Product detail → Cart → Checkout → Order confirmation**

Customers should be able to browse products, select a size or variant, see the price and availability, add items to a persistent cart, provide delivery/contact details, review the total, place an order, and receive clear confirmation. Provide a visible way to contact Nganzi if a customer needs help.

### Public pages

1. **Shop home**
    - Brand-led hero with a clear **Shop coffee** call to action.
    - Featured and best-selling products, current offers, and gift bundles where available.
    - Brief Ugandan origin/story section and links to the main website.
2. **Product collection**
    - Browse and filter available products by category, roast, or coffee type.
    - Product cards show an image, name, concise description, price, and availability.
3. **Product detail**
    - Product images, description, origin, roast/tasting details where known, available sizes/variants, price, stock status, and quantity selector.
    - Clear add-to-cart action and related products.
4. **Cart**
    - Edit quantities, remove items, view item totals and the order subtotal, and continue shopping or checkout.
5. **Checkout**
    - Collect the customer’s contact and delivery information.
    - Show delivery fees, payment options, and the final amount before the customer confirms.
    - Validate input and explain errors clearly.
6. **Order confirmation and order lookup**
    - Show an order reference and a useful summary after successful placement.
    - Provide a reliable way for customers to check order status or contact the business.
7. **Supporting information**
    - Delivery and returns information, FAQs, privacy, and terms, linked from checkout and the footer.

### Initial product catalogue

Use the existing website as the starting point for product content, then have an authorized admin verify prices, stock, sizes, and descriptions before publishing:

- Light Roast
- Medium Roast
- Dark Roast
- Raw Coffee Beans, including Arabica and Robusta options where stocked
- Merchandise and gift bundles, if offered

The current website mentions coffee pack sizes of **100g, 250g, 500g, and 1kg**. Treat sizes as product variants where applicable; do not imply every product is offered in every size. Keep product descriptions and tasting notes editable in the dashboard.

## 4. Laravel sales-management dashboard

Create a staff-only admin area at **`nganzicoffee.com/admin`**, separate from customer-facing shop pages. Require authenticated accounts and role-based permissions; do not expose sales or customer data publicly.

### Dashboard modules

- **Overview:** sales for selected periods, order counts, average order value, pending/unfulfilled orders, and low-stock alerts.
- **Orders:** searchable/filterable order list, order details, customer and item summaries, payment and fulfilment status, internal notes, and status updates with timestamps.
- **Products:** create, edit, publish/unpublish, and archive products; manage descriptions, images, categories, variants, prices, stock, and featured status.
- **Inventory:** adjust stock with an auditable reason/history; show low-stock and out-of-stock items.
- **Customers:** view customer contact details and order history only as needed to fulfil orders and provide support.
- **Sales reports:** date-range summaries, product performance, order totals, and exportable reports for business use.
- **Traffic analytics:** show useful visit and conversion summaries by integrating a privacy-appropriate analytics service for both the marketing website and shop. Treat these as analytics data, separate from order and payment records; do not build invasive visitor tracking into the shop just to populate the dashboard.
- **Store settings:** business contact details, currency, delivery options/fees, tax configuration if applicable, and payment-provider configuration.
- **Staff and access:** invite/manage staff accounts and assign the least access needed for their work.

### Order lifecycle

Use explicit, understandable statuses, such as **Pending**, **Confirmed**, **Processing**, **Ready to dispatch**, **Shipped/Dispatched**, **Completed**, and **Cancelled**. Keep payment status separate from fulfilment status (for example, **Unpaid**, **Paid**, **Refunded**). Record status changes and the staff member who made them.

The admin should be able to find an order quickly, update its status, and see what action is needed next. Customer notifications should reflect real order/payment events and should not claim payment or dispatch succeeded until confirmed.

## 5. Implementation and operational guidance

- Use Laravel routes, controllers/actions, validation, policies, and database models in the project’s established conventions.
- Keep storefront and admin authorization separate; protect every admin operation server-side, not just by hiding interface controls.
- Protect admin accounts with multi-factor authentication where available, rate-limited sign-in, least-privilege roles, and audit logs for sensitive actions. An `/admin` URL or a separate admin hostname is not a security boundary.
- Model products, variants, orders, order items, customers, payments, and inventory changes explicitly. Store an order-item snapshot of product name, selected variant, and unit price so historical orders remain accurate after catalogue edits.
- Treat prices and totals as server-calculated values. Validate stock and availability when an order is submitted; prevent quantity and price tampering.
- Store payment credentials in environment-managed secrets, never in source control. Use a payment provider’s verified callbacks/webhooks before marking an order paid.
- Make currency, delivery areas/fees, payment methods, and tax behavior configurable once the business confirms its operating rules. Display the currency explicitly and show all fees before order submission.
- Support responsive layouts, keyboard navigation, accessible form labels, useful empty/error states, and optimized product imagery.
- Add appropriate transactional emails or notifications for order confirmation and meaningful status changes. Avoid sending duplicate notifications when an admin saves an unchanged status.
- Back up the database and product media; restrict access to customer information and define a practical retention policy.
- Test the complete buying journey and admin workflows, including stock updates, failed validation, cancelled/unpaid orders, and permission boundaries.

## 6. Launch checklist

- Confirm product names, images, variants, descriptions, prices, and stock.
- Confirm currency, delivery regions and fees, payment methods, tax handling, and returns policy.
- Verify site navigation and internal links across brand, catalogue, cart, and checkout.
- Configure HTTPS, production environment variables, mail delivery, payment callbacks, backups, and monitoring.
- Create admin accounts securely and verify permissions.
- Test mobile checkout, order confirmation, payment outcomes, inventory behavior, and dashboard reporting before launch.
