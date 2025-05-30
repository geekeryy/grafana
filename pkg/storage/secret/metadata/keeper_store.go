package metadata

import (
	"context"

	claims "github.com/grafana/authlib/types"
	secretv0alpha1 "github.com/grafana/grafana/pkg/apis/secret/v0alpha1"
	"github.com/grafana/grafana/pkg/infra/db"
	"github.com/grafana/grafana/pkg/registry/apis/secret/contracts"
	"github.com/grafana/grafana/pkg/registry/apis/secret/xkube"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
)

func ProvideKeeperMetadataStorage(db db.DB, features featuremgmt.FeatureToggles, accessClient claims.AccessClient) (contracts.KeeperMetadataStorage, error) {
	if !features.IsEnabledGlobally(featuremgmt.FlagGrafanaAPIServerWithExperimentalAPIs) ||
		!features.IsEnabledGlobally(featuremgmt.FlagSecretsManagementAppPlatform) {
		return &keeperMetadataStorage{}, nil
	}

	return &keeperMetadataStorage{db: db, accessClient: accessClient}, nil
}

// keeperMetadataStorage is the actual implementation of the keeper metadata storage.
type keeperMetadataStorage struct {
	db           db.DB
	accessClient claims.AccessClient
}

func (s *keeperMetadataStorage) Create(ctx context.Context, keeper *secretv0alpha1.Keeper, actorUID string) (*secretv0alpha1.Keeper, error) {
	return nil, nil
}

func (s *keeperMetadataStorage) Read(ctx context.Context, namespace xkube.Namespace, name string, opts contracts.ReadOpts) (*secretv0alpha1.Keeper, error) {
	return nil, nil
}

func (s *keeperMetadataStorage) Update(ctx context.Context, newKeeper *secretv0alpha1.Keeper, actorUID string) (*secretv0alpha1.Keeper, error) {
	return nil, nil
}

func (s *keeperMetadataStorage) Delete(ctx context.Context, namespace xkube.Namespace, name string) error {
	return nil
}

func (s *keeperMetadataStorage) List(ctx context.Context, namespace xkube.Namespace) ([]secretv0alpha1.Keeper, error) {
	return nil, nil
}

func (s *keeperMetadataStorage) GetKeeperConfig(ctx context.Context, namespace string, name *string, opts contracts.ReadOpts) (secretv0alpha1.KeeperConfig, error) {
	return nil, nil
}
