/**
 * Java enums mirroring the native Postgres enum types in docs/schema.sql.
 * Mapped via @JdbcTypeCode(SqlTypes.NAMED_ENUM) so the DB enum and the Java
 * enum stay the same type on the wire — no string-matching drift.
 */
package com.nutrifyai.core.entity.enums;
