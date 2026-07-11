import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  AlertCircle,
  Building2,
  Check,
  Cloud,
  Eye,
  EyeOff,
  History,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { login } from "./api";
import { ACCESS_ACCOUNT_PASSWORD, Brand, ROLE_META, errorMessage } from "./orderUi";
import type { AccessAccount, User, UserRole } from "./types";

export function LoginScreen({
  accounts,
  connectionError,
  onRetry,
  onAuthenticated,
}: {
  accounts: AccessAccount[];
  connectionError: string;
  onRetry: () => void;
  onAuthenticated: (user: User) => void;
}) {
  const tenants = useMemo(
    () =>
      Array.from(new Map(accounts.map((account) => [account.tenantSlug, account.tenantName])).entries()).map(
        ([slug, name]) => ({ slug, name }),
      ),
    [accounts],
  );
  const [tenantSlug, setTenantSlug] = useState(tenants[0]?.slug ?? "");
  const [role, setRole] = useState<UserRole>("admin");
  const [password, setPassword] = useState(ACCESS_ACCOUNT_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    if (!tenantSlug && tenants[0]) setTenantSlug(tenants[0].slug);
  }, [tenantSlug, tenants]);

  const account = accounts.find((item) => item.tenantSlug === tenantSlug && item.role === role) ?? null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!account) return;
    setSubmitting(true);
    setLoginError("");
    try {
      const authenticated = await login({
        tenantSlug: account.tenantSlug,
        email: account.email,
        password,
      });
      onAuthenticated(authenticated);
    } catch (error) {
      setLoginError(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="loginPage">
      <section className="loginIntro" aria-label="로그인 안내">
        <Brand />
        <p>
          주문 상태와 역할 권한, 감사 이력을 한 화면에서 관리합니다.
          <br />
          회사별 주문 흐름을 분리하고 변경 과정을 추적합니다.
        </p>
        <ul>
          <li>
            <ShieldCheck size={17} /> 서버가 역할별 상태 전이를 검증합니다.
          </li>
          <li>
            <History size={17} /> 모든 변경은 감사 로그로 남습니다.
          </li>
          <li>
            <Building2 size={17} /> 회사별 데이터가 분리됩니다.
          </li>
        </ul>
      </section>

      <section className="loginPanel" aria-labelledby="loginTitle">
        <div className="loginPanelHeading">
          <span className="contextBadge">ROLE-BASED ACCESS</span>
          <h1 id="loginTitle">OrderOps Cloud</h1>
          <p>운영 워크스페이스에 로그인</p>
        </div>

        {connectionError && !accounts.length ? (
          <div className="loginConnectionError" role="alert">
            <AlertCircle size={18} />
            <div>
              <strong>API에 연결하지 못했습니다.</strong>
              <span>{connectionError}</span>
            </div>
            <button type="button" className="secondaryButton" onClick={onRetry}>
              <RefreshCw size={16} /> 다시 연결
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="formField">
              <span>테넌트 선택</span>
              <span className="selectControl">
                <Building2 size={16} aria-hidden="true" />
                <select value={tenantSlug} onChange={(event) => setTenantSlug(event.target.value)}>
                  {tenants.map((tenant) => (
                    <option key={tenant.slug} value={tenant.slug}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
              </span>
            </label>

            <fieldset className="rolePicker">
              <legend>역할 계정 선택</legend>
              <div>
                {(Object.keys(ROLE_META) as UserRole[]).map((roleOption) => (
                  <button
                    type="button"
                    className={role === roleOption ? "active" : ""}
                    aria-pressed={role === roleOption}
                    onClick={() => setRole(roleOption)}
                    key={roleOption}
                  >
                    <UserRound size={17} aria-hidden="true" />
                    <span>
                      <strong>{ROLE_META[roleOption].label}</strong>
                      <small>{ROLE_META[roleOption].description}</small>
                    </span>
                    <i>{role === roleOption ? <Check size={13} /> : null}</i>
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="formField">
              <span>이메일</span>
              <input type="email" value={account?.email ?? ""} readOnly />
            </label>

            <label className="formField">
              <span>비밀번호</span>
              <span className="passwordControl">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>

            {loginError ? (
              <div className="formError" role="alert">
                <AlertCircle size={16} /> {loginError}
              </div>
            ) : null}

            <button className="primaryButton loginSubmit" type="submit" disabled={!account || submitting}>
              {submitting ? <LoaderCircle className="spin" size={17} /> : <Cloud size={17} />}
              {submitting ? "로그인 중" : "주문 워크스페이스 열기"}
            </button>
          </form>
        )}

        <p className="accessContext">
          접속한 역할의 권한 범위가 모든 화면과 API에 동일하게 적용됩니다.
        </p>
      </section>
    </main>
  );
}
