import assert from 'node:assert/strict';
import test from 'node:test';
import {
    formatDisplayPrice,
    formatPrice,
} from '../../resources/js/lib/price.ts';

test('UGX uses whole shillings and USD uses cents', () => {
    assert.match(formatPrice(25000, 'UGX'), /25,000/);
    assert.match(formatPrice(625, 'USD'), /6\.25/);
});

test('owner rate converts each selected pack and cart amount to estimated USD', () => {
    assert.match(formatDisplayPrice(25000, 'UGX', 'USD', 4000), /^≈ .*6\.25$/);
    assert.match(formatDisplayPrice(50000, 'UGX', 'USD', 4000), /^≈ .*12\.50$/);
    assert.match(formatDisplayPrice(25000, 'UGX', 'USD', 5000), /^≈ .*5\.00$/);
});

test('switching back to UGX returns canonical pricing', () => {
    assert.equal(
        formatDisplayPrice(25000, 'UGX', 'UGX', 4000),
        formatPrice(25000, 'UGX'),
    );
});

test('unset or invalid rates never mislabel shillings as dollars', () => {
    for (const rate of [0, -1, NaN, Infinity]) {
        assert.equal(
            formatDisplayPrice(25000, 'UGX', 'USD', rate),
            formatPrice(25000, 'UGX'),
        );
    }
});

test('historical orders in other currencies are not converted using the UGX rate', () => {
    assert.equal(
        formatDisplayPrice(625, 'USD', 'USD', 4000),
        formatPrice(625, 'USD'),
    );
});
