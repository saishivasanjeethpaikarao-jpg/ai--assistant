"""Tests for the audioop compatibility shim.

Phase 1: ``audioop`` was removed in Python 3.13. The shim in
``assistant_core`` provides an ``_rms(data, width)`` function that works on
both <3.13 (using the stdlib ``audioop``) and 3.13+ (using ``array.array``).
These tests verify the shim's output for silent and known-amplitude inputs.
"""
import array
import math

import pytest


def _to_bytes(samples):
    """Convert a list of signed ints to bytes (little-endian)."""
    return array.array('h', samples).tobytes()


def test_rms_silent_returns_zero():
    from backend.assistant_core import _rms
    assert _rms(b"") == 0
    assert _rms(b"\x00\x00" * 100) == 0


def test_rms_known_amplitude():
    """A 1000-Hz full-scale sine sampled at 16 kHz, 16-bit signed.

    For a full-scale sine of amplitude 32767, the RMS is 32767 / sqrt(2) ≈
    23170. The shim returns an int (truncated), so allow ±5 for rounding.
    """
    from backend.assistant_core import _rms
    import math as _m
    samples = []
    for i in range(1600):
        v = int(32767 * _m.sin(2 * _m.pi * 1000 * i / 16000))
        samples.append(v)
    data = _to_bytes(samples)
    expected = 32767 / _m.sqrt(2)
    got = _rms(data, 2)
    assert abs(got - expected) < 5, f"RMS off: got {got}, expected ~{expected:.1f}"


def test_rms_supports_widths_1_2_4():
    from backend.assistant_core import _rms
    # width=1
    s1 = array.array('b', [10, -10, 10, -10] * 25).tobytes()
    assert _rms(s1, 1) > 0
    # width=4
    s4 = array.array('i', [1000, -1000] * 50).tobytes()
    assert _rms(s4, 4) > 0
    # invalid width
    with pytest.raises(ValueError):
        _rms(b"\x00\x00", 3)
