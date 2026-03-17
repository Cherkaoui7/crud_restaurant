<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProfileApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_update_profile_details(): void
    {
        $user = User::factory()->create([
            'name' => 'Old Name',
            'email' => 'old@example.test',
        ]);

        Sanctum::actingAs($user);

        $this->putJson('/api/profile', [
            'name' => 'Updated Name',
            'email' => 'updated@example.test',
        ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Updated Name')
            ->assertJsonPath('data.email', 'updated@example.test');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Updated Name',
            'email' => 'updated@example.test',
        ]);
    }

    public function test_user_cannot_update_profile_with_an_email_that_is_already_taken(): void
    {
        $user = User::factory()->create();
        $anotherUser = User::factory()->create([
            'email' => 'already@taken.test',
        ]);

        Sanctum::actingAs($user);

        $this->putJson('/api/profile', [
            'name' => 'Any Name',
            'email' => $anotherUser->email,
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_authenticated_user_can_update_password(): void
    {
        $user = User::factory()->create([
            'password' => 'password',
        ]);

        Sanctum::actingAs($user);

        $this->putJson('/api/profile/password', [
            'current_password' => 'password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])
            ->assertOk()
            ->assertJsonPath('message', 'Password updated successfully.');

        $user->refresh();

        $this->assertTrue(Hash::check('new-password', $user->password));
    }

    public function test_password_update_requires_the_correct_current_password(): void
    {
        $user = User::factory()->create([
            'password' => 'password',
        ]);

        Sanctum::actingAs($user);

        $this->putJson('/api/profile/password', [
            'current_password' => 'wrong-password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['current_password']);
    }
}
