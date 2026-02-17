import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useActionData, useNavigation, Form } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Badge,
  Button,
  ProgressBar,
  Banner,
  Divider,
  Select,
} from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import { storesApi, subscriptionsApi } from "~/lib/api.server";
import { formatDate, formatNumber } from "~/lib/utils/formatters";
import { PLANS, STATUS_LABELS, STATUS_TONES } from "~/lib/constants";
import type { SubscriptionPlan } from "~/lib/types";

export const meta: MetaFunction = () => [
  { title: "Abonelik - WhatsOrder" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const response = await storesApi.getByShopDomain(shop);
  const store = response.store;

  if (!store) {
    throw new Response("Mağaza bulunamadı", { status: 404 });
  }

  return json({ store });
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const storeResponse = await storesApi.getByShopDomain(shop);
  const store = storeResponse.store;

  if (!store) {
    throw new Response("Mağaza bulunamadı", { status: 404 });
  }

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "upgrade") {
    const plan = formData.get("plan") as SubscriptionPlan;
    try {
      await subscriptionsApi.upgrade(store.id, plan);
      return json({ success: true, message: `Plan ${PLANS[plan]?.name} olarak güncellendi!` });
    } catch (error) {
      return json(
        { error: error instanceof Error ? error.message : "Hata oluştu" },
        { status: 400 }
      );
    }
  }

  if (intent === "cancel") {
    try {
      await subscriptionsApi.cancel(store.id);
      return json({ success: true, message: "Abonelik iptal edildi." });
    } catch (error) {
      return json(
        { error: error instanceof Error ? error.message : "Hata oluştu" },
        { status: 400 }
      );
    }
  }

  return json({ error: "Geçersiz işlem" }, { status: 400 });
}

export default function SubscriptionIndex() {
  const { store } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const sub = store.subscription;

  const planOptions = Object.entries(PLANS).map(([value, plan]) => ({
    label: `${plan.name} - $${plan.price}/ay (${formatNumber(plan.limit)} mesaj)`,
    value,
  }));

  const usagePercent = sub
    ? Math.round((sub.messages_sent_this_month / sub.monthly_message_limit) * 100)
    : 0;

  return (
    <Page
      title="Abonelik Yönetimi"
      subtitle={store.store_name}
      backAction={{ url: "/app", content: "Dashboard" }}
    >
      <BlockStack gap="600">
        {actionData && "message" in actionData && actionData.message && (
          <Banner tone="success">{actionData.message}</Banner>
        )}
        {actionData && "error" in actionData && actionData.error && (
          <Banner tone="critical">{actionData.error}</Banner>
        )}

        {/* Plan Overview */}
        <Layout>
          {Object.entries(PLANS).map(([key, plan]) => (
            <Layout.Section variant="oneQuarter" key={key}>
              <Card>
                <BlockStack gap="200">
                  <Text variant="headingMd" as="h3">{plan.name}</Text>
                  <Text variant="heading2xl" as="p">
                    ${plan.price}
                    <Text variant="bodySm" tone="subdued" as="span">/ay</Text>
                  </Text>
                  <Text variant="bodySm" tone="subdued" as="p">
                    {formatNumber(plan.limit)} mesaj/ay
                  </Text>
                  <Text variant="bodySm" as="p">{plan.description}</Text>
                </BlockStack>
              </Card>
            </Layout.Section>
          ))}
        </Layout>

        {/* Current Subscription */}
        {sub ? (
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <BlockStack gap="100">
                  <Text variant="headingMd" as="h2">Mevcut Abonelik</Text>
                  <Text variant="bodySm" tone="subdued" as="p">
                    {store.shopify_domain}
                  </Text>
                </BlockStack>
                <InlineStack gap="200">
                  <Badge tone={STATUS_TONES[sub.status]}>
                    {STATUS_LABELS[sub.status]}
                  </Badge>
                  <Badge>
                    {PLANS[sub.plan]?.name}
                  </Badge>
                </InlineStack>
              </InlineStack>

              {/* Usage Bar */}
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text variant="bodySm" tone="subdued" as="span">
                    Bu Ay Kullanım
                  </Text>
                  <Text variant="bodySm" as="span">
                    {formatNumber(sub.messages_sent_this_month)} / {formatNumber(sub.monthly_message_limit)} mesaj
                  </Text>
                </InlineStack>
                <ProgressBar
                  progress={usagePercent}
                  tone={
                    usagePercent > 90
                      ? "critical"
                      : usagePercent > 70
                      ? "attention"
                      : "success"
                  }
                />
                <Text variant="bodySm" tone="subdued" as="p">
                  {formatNumber(sub.monthly_message_limit - sub.messages_sent_this_month)} mesaj kaldı
                  {sub.trial_ends_at && (
                    <> · Deneme bitiş: {formatDate(sub.trial_ends_at)}</>
                  )}
                </Text>
              </BlockStack>

              <Divider />

              {/* Plan Upgrade Form */}
              <Form method="post">
                <input type="hidden" name="intent" value="upgrade" />
                <InlineStack gap="300" align="end">
                  <div style={{ minWidth: "300px" }}>
                    <Select
                      label="Plan Değiştir"
                      name="plan"
                      options={planOptions}
                      value={sub.plan}
                      onChange={() => {}}
                    />
                  </div>
                  <div style={{ marginTop: "20px" }}>
                    <Button submit loading={isSubmitting}>
                      Planı Güncelle
                    </Button>
                  </div>
                </InlineStack>
              </Form>

              {/* Cancel Button */}
              {sub.status !== "canceled" && (
                <Form method="post">
                  <input type="hidden" name="intent" value="cancel" />
                  <Button submit tone="critical" loading={isSubmitting}>
                    Aboneliği İptal Et
                  </Button>
                </Form>
              )}
            </BlockStack>
          </Card>
        ) : (
          <Banner tone="warning">
            <Text as="p">
              Aktif aboneliğiniz bulunamadı. Lütfen bir plan seçin.
            </Text>
          </Banner>
        )}
      </BlockStack>
    </Page>
  );
}
