<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_and_receive_a_token(): void
    {
        $user = User::factory()->create([
            'password' => 'password',
            'role' => 'admin',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response
            ->assertOk()
            ->assertJsonStructure([
                'token',
                'user' => ['id', 'name', 'email', 'role'],
            ])
            ->assertJsonPath('user.email', $user->email)
            ->assertJsonPath('user.role', 'admin');

        $this->assertDatabaseCount('personal_access_tokens', 1);
    }

    public function test_me_endpoint_requires_authentication(): void
    {
        $this->getJson('/api/me')->assertUnauthorized();
    }
}
