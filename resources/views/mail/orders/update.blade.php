<x-mail::message>
# {{ $headline }}

Hi {{ $customerFirstName }},

{{ $intro }}

**Order reference:** {{ $shortReference }}

<x-mail::table>
| Item | Qty |
|:-----|----:|
@foreach ($items as $item)
| {{ $item->product_name }} ({{ $item->variant_label }}) | {{ $item->quantity }} |
@endforeach
| **Total** | **{{ $totalFormatted }}** |
</x-mail::table>

@if ($nextSteps !== '')
**What happens next:** {{ $nextSteps }}
@endif

<x-mail::button :url="$orderUrl" color="primary">
View your order
</x-mail::button>

@if ($supportEmail || $supportPhone)
Questions? Contact us at
@if ($supportEmail){{ $supportEmail }}@endif
@if ($supportEmail && $supportPhone) or @endif
@if ($supportPhone){{ $supportPhone }}@endif
and quote your order reference.
@else
Questions? Reply to this email and quote your order reference.
@endif

From Uganda, with purpose,<br>
Nganzi Coffee
</x-mail::message>
