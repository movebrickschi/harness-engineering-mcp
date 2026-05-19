---
spec_id: harness-spec-stack-java-spring
applies_to: [solo, small-team, mid-team, org]
min_level: L1
project_types: [backend-service, library]
---

# Stack Adapter: Java / Spring

## 1. 项目识别

- 入口：`pom.xml` 或 `build.gradle(.kts)`
- 关键依赖：`spring-boot-starter-*`、`spring-cloud-*`、`mybatis-plus`
- 典型版本：JDK 21 + Spring Boot 3.4 / 4.x

## 2. 依赖管理

| 工具 | 命令 |
| --- | --- |
| Maven | `mvn -B clean install` |
| Gradle | `./gradlew build` |
| 锁定 | Maven enforcer plugin / Gradle resolution strategy |

## 3. 测试矩阵

| 类型 | 推荐工具 | 命令 |
| --- | --- | --- |
| 单元 | JUnit 5 + Mockito | `mvn -B test` |
| 集成 | Spring Boot Test | `mvn -B verify` |
| Mapper / SQL | MyBatis-Plus + H2 / Testcontainers | 集成 |
| Web | MockMvc / WebTestClient | 集成 |
| 契约 | Spring Cloud Contract / Pact | 单独 module |

## 4. 覆盖率

```xml
<plugin>
  <groupId>org.jacoco</groupId>
  <artifactId>jacoco-maven-plugin</artifactId>
  <version>0.8.12</version>
  <executions>
    <execution>
      <goals><goal>prepare-agent</goal></goals>
    </execution>
    <execution>
      <id>report</id>
      <phase>test</phase>
      <goals><goal>report</goal></goals>
    </execution>
  </executions>
</plugin>
```

报告：`target/site/jacoco/jacoco.xml`。

## 5. 静态检查

| 工具 | 用途 |
| --- | --- |
| Checkstyle | 代码风格 |
| SpotBugs | 静态缺陷 |
| PMD | 代码异味 |
| Error Prone（编译期） | 隐式问题 |
| ArchUnit | 架构约束（DDD 分层） |

## 6. 安全扫描

| 维度 | 工具 |
| --- | --- |
| SCA | OWASP Dependency Check / Snyk |
| SAST | SpotBugs Find Security Bugs / Semgrep |
| 密钥扫描 | gitleaks / trufflehog（本规范脚本 C 组） |
| SBOM | CycloneDX Maven Plugin |

## 7. 性能

- 接口压测：JMeter / Gatling / Vegeta
- 火焰图：async-profiler / JFR
- 内存：Eclipse MAT / JProfiler

## 8. 项目类型差异

### 8.1 Backend Service

- API 文档：springdoc-openapi（OpenAPI 3）
- 监控：Micrometer + Prometheus
- 配置中心：Spring Cloud Config / Nacos
- 容器化：Spring Boot 3 原生支持 Buildpacks

### 8.2 Library

- 多版本兼容：toolchains / matrix CI
- 发布：Maven Central（OSSRH）
- 兼容性测试：依赖范围矩阵

## 9. CI 关键步骤

参考 [`templates/ci/github-actions.yml.skel`](../templates/ci/github-actions.yml.skel)：

```yaml
- name: Set up JDK
  uses: actions/setup-java@v4
  with: { distribution: temurin, java-version: 21, cache: maven }
- run: mvn -B verify
- run: mvn -B com.github.spotbugs:spotbugs-maven-plugin:check
- run: mvn -B org.owasp:dependency-check-maven:check  # mid-team+
```

## 10. 与本规范的常见映射

| 规范条目 | Java/Spring 实现 |
| --- | --- |
| Code Review checklist 安全维度 | SpotBugs FSB + Semgrep |
| 测试金字塔 | JUnit + Spring Boot Test + Pact |
| 性能预算 | Micrometer P95 + JMeter 基线 |
| 密钥扫描 | gitleaks + 配置中心化 |
| Audit Log | AOP + 自定义注解 + 独立日志 appender |

## 11. 反模式（栈特定）

- `@Autowired` 字段注入（应改构造器注入，参考 `.cursor/rules/15`）
- 在 `application.yml` 写明文密钥
- 滥用 `@SpringBootTest` 做全部测试（慢且耦合）
- Mapper XML SQL 字符串拼接
- `System.out.println` 替代 `@Slf4j`
