package io.github.hienpham0344.stayfinder.admin;

import io.github.hienpham0344.stayfinder.admin.controller.AdminController;
import io.github.hienpham0344.stayfinder.admin.dto.AdminDtos.*;
import io.github.hienpham0344.stayfinder.admin.service.AdminService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import java.util.List;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AdminController.class)
@Import({AdminHttpTest.Boundary.class, AdminController.class})
class AdminHttpTest {
    @Configuration @EnableMethodSecurity
    static class Boundary {
        @Bean SecurityFilterChain filter(HttpSecurity http) throws Exception {
            return http.csrf(c->c.disable()).authorizeHttpRequests(a->a.anyRequest().authenticated()).build();
        }
    }
    @Autowired MockMvc mvc;
    @MockitoBean AdminService service;
    @Test void customersAndPartnersCannotListAccounts() throws Exception {
        mvc.perform(get("/api/admin/users").with(user("user").roles("CUSTOMER"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/users").with(user("partner").roles("PARTNER"))).andExpect(status().isForbidden());
        verifyNoInteractions(service);
    }
    @Test void administratorCanReadPagedAccounts() throws Exception {
        when(service.accounts(0,20,null,"")).thenReturn(new Page<>(List.of(),0,0,20));
        mvc.perform(get("/api/admin/users").with(user("admin").roles("ADMIN")))
            .andExpect(status().isOk()).andExpect(jsonPath("$.result.items").isEmpty());
    }
}
