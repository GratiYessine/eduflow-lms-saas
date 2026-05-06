package com.example.lms.common.util;

import org.springframework.stereotype.Component;

@Component
public class StringSanitizer {

    public String clean(String value) {
        if (value == null) {
            return null;
        }
        return value.replaceAll("[\\p{Cntrl}&&[^\r\n\t]]", "").trim();
    }

    public String email(String value) {
        String cleaned = clean(value);
        return cleaned == null ? null : cleaned.toLowerCase();
    }
}
