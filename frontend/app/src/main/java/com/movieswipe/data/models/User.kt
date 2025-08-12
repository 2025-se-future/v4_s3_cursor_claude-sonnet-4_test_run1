package com.movieswipe.data.models

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

/**
 * User data model representing a user in the MovieSwipe application
 */
@JsonClass(generateAdapter = true)
data class User(
    @Json(name = "id")
    val id: String,
    
    @Json(name = "email")
    val email: String,
    
    @Json(name = "name")
    val name: String,
    
    @Json(name = "profilePicture")
    val profilePicture: String
)
