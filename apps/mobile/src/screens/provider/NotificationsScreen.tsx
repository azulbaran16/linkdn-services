import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, FlatList } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '../../lib/api';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { SkeletonCard } from '../../components/Skeleton';
import { colors, fontSize, fontWeight, spacing, borderRadius, screenPadding } from '../../theme';

type TabKey = 'rules' | 'campaigns' | 'history';

export function NotificationsScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>('rules');

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        {([
          { key: 'rules' as TabKey, label: 'Reglas' },
          { key: 'campaigns' as TabKey, label: 'Campanas' },
          { key: 'history' as TabKey, label: 'Historial' },
        ]).map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {activeTab === 'rules' && <RulesTab />}
      {activeTab === 'campaigns' && <CampaignsTab />}
      {activeTab === 'history' && <HistoryTab />}
    </View>
  );
}

function RulesTab() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notification-rules'],
    queryFn: () => apiGet<{ rules: any[] }>('/api/notifications/rules'),
  });

  const toggleMutation = useMutation({
    mutationFn: (rule: any) =>
      apiPut(`/api/notifications/rules/${rule.id}`, { active: !rule.active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notification-rules'] }),
  });

  const rules = data?.rules || [];

  if (isLoading) {
    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={screenPadding}>
        <SkeletonCard />
        <SkeletonCard />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.tabContent} contentContainerStyle={screenPadding}>
      {rules.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Sin reglas configuradas</Text>
          <Text style={styles.emptyDesc}>
            Crea reglas automaticas para recordar a tus clientes.
          </Text>
        </View>
      ) : (
        rules.map((rule: any) => (
          <Card key={rule.id} style={styles.ruleCard}>
            <View style={styles.ruleHeader}>
              <View style={styles.ruleInfo}>
                <Badge
                  label={rule.type === 'POST_SERVICE' ? 'Post-servicio' : 'Pre-cita'}
                  variant={rule.type === 'POST_SERVICE' ? 'primary' : 'info'}
                />
                <Text style={styles.ruleDelay}>
                  {rule.delayValue} {rule.type === 'POST_SERVICE' ? 'dias' : 'horas'}
                </Text>
              </View>
              <Switch
                value={rule.active}
                onValueChange={() => toggleMutation.mutate(rule)}
                trackColor={{ false: colors.neutral200, true: colors.primaryLight }}
                thumbColor={rule.active ? colors.primary : colors.neutral500}
              />
            </View>
            {rule.service && (
              <Text style={styles.ruleService}>Servicio: {rule.service.name}</Text>
            )}
            <Text style={styles.ruleTemplate} numberOfLines={2}>{rule.template}</Text>
          </Card>
        ))
      )}

      <Button
        title="Crear regla"
        onPress={() => {/* TODO: navigate to create rule screen */}}
        style={{ marginTop: spacing.md }}
      />
    </ScrollView>
  );
}

function CampaignsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => apiGet<{ campaigns: any[] }>('/api/campaigns'),
  });

  const campaigns = data?.campaigns || [];

  const statusVariant = (status: string) => {
    switch (status) {
      case 'SENT': return 'success';
      case 'SCHEDULED': return 'info';
      case 'FAILED': return 'danger';
      default: return 'neutral';
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'SENT': return 'Enviada';
      case 'SCHEDULED': return 'Programada';
      case 'FAILED': return 'Fallida';
      default: return 'Borrador';
    }
  };

  if (isLoading) {
    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={screenPadding}>
        <SkeletonCard />
        <SkeletonCard />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.tabContent} contentContainerStyle={screenPadding}>
      {campaigns.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Sin campanas</Text>
          <Text style={styles.emptyDesc}>
            Crea campanas para enviar mensajes a tus clientes.
          </Text>
        </View>
      ) : (
        campaigns.map((campaign: any) => (
          <Card key={campaign.id} style={styles.campaignCard}>
            <View style={styles.campaignHeader}>
              <Text style={styles.campaignSubject}>{campaign.subject}</Text>
              <Badge
                label={statusLabel(campaign.status)}
                variant={statusVariant(campaign.status) as any}
              />
            </View>
            <Text style={styles.campaignMessage} numberOfLines={2}>
              {campaign.message}
            </Text>
            <View style={styles.campaignFooter}>
              <Text style={styles.campaignStat}>
                {campaign._count?.recipients || campaign.recipientCount || 0} destinatarios
              </Text>
              {campaign.scheduledAt && (
                <Text style={styles.campaignStat}>
                  {new Date(campaign.scheduledAt).toLocaleDateString('es-CO')}
                </Text>
              )}
            </View>
          </Card>
        ))
      )}

      <Button
        title="Nueva campana"
        onPress={() => {/* TODO: navigate to create campaign */}}
        style={{ marginTop: spacing.md }}
      />
    </ScrollView>
  );
}

function HistoryTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['notification-history'],
    queryFn: () => apiGet<{ logs: any[] }>('/api/notifications/history'),
  });

  const logs = data?.logs || [];

  const typeLabel = (type: string) => {
    switch (type) {
      case 'RULE': return 'Automatica';
      case 'CAMPAIGN': return 'Campana';
      case 'MANUAL': return 'Manual';
      default: return type;
    }
  };

  if (isLoading) {
    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={screenPadding}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </ScrollView>
    );
  }

  return (
    <FlatList
      data={logs}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ ...screenPadding, paddingBottom: spacing['3xl'] }}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Sin historial</Text>
          <Text style={styles.emptyDesc}>
            Las notificaciones enviadas apareceran aqui.
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <Card style={styles.logCard}>
          <View style={styles.logHeader}>
            <Badge label={typeLabel(item.type)} variant="neutral" />
            <Text style={styles.logDate}>
              {new Date(item.sentAt).toLocaleDateString('es-CO', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          {item.clientProfile && (
            <Text style={styles.logClient}>
              {item.clientProfile.name} ({item.clientProfile.email})
            </Text>
          )}
          <Text style={styles.logSubject}>{item.subject}</Text>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral100,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral200,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.ms,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.neutral500,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  tabContent: {
    flex: 1,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.neutral900,
    marginBottom: spacing.sm,
  },
  emptyDesc: {
    fontSize: fontSize.sm,
    color: colors.neutral500,
    textAlign: 'center',
    lineHeight: 20,
  },
  ruleCard: {
    paddingVertical: spacing.ms,
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  ruleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ruleDelay: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.neutral900,
  },
  ruleService: {
    fontSize: fontSize.xs,
    color: colors.neutral500,
    marginBottom: spacing.xs,
  },
  ruleTemplate: {
    fontSize: fontSize.sm,
    color: colors.neutral700,
    lineHeight: 20,
  },
  campaignCard: {
    paddingVertical: spacing.ms,
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  campaignSubject: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.neutral900,
    flex: 1,
    marginRight: spacing.sm,
  },
  campaignMessage: {
    fontSize: fontSize.sm,
    color: colors.neutral700,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  campaignFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  campaignStat: {
    fontSize: fontSize.xs,
    color: colors.neutral500,
  },
  logCard: {
    paddingVertical: spacing.ms,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  logDate: {
    fontSize: fontSize.xs,
    color: colors.neutral500,
  },
  logClient: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.neutral900,
    marginBottom: spacing.xs,
  },
  logSubject: {
    fontSize: fontSize.sm,
    color: colors.neutral700,
  },
});
