import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Archive, Calendar, Users, CheckCircle, Clock, TrendingUp, ChevronDown, ChevronUp, Package, FileText } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';

dayjs.extend(relativeTime);
dayjs.extend(duration);

export function ArchiveViewer() {
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedArchive, setExpandedArchive] = useState(null);
  const [selectedArchiveDetails, setSelectedArchiveDetails] = useState(null);

  useEffect(() => {
    fetchArchives();
  }, []);

  const fetchArchives = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/archive');
      if (!response.ok) {
        throw new Error('Failed to fetch archives');
      }
      const data = await response.json();
      setArchives(data.archives || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching archives:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchArchiveDetails = async (filename) => {
    try {
      const response = await fetch(`http://localhost:3001/api/archive/${filename}`);
      if (!response.ok) {
        throw new Error('Failed to fetch archive details');
      }
      const data = await response.json();
      setSelectedArchiveDetails(data);
    } catch (err) {
      console.error('Error fetching archive details:', err);
    }
  };

  const toggleExpand = async (filename) => {
    if (expandedArchive === filename) {
      setExpandedArchive(null);
      setSelectedArchiveDetails(null);
    } else {
      setExpandedArchive(filename);
      await fetchArchiveDetails(filename);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Package className="h-12 w-12 text-gray-500 mx-auto mb-3 animate-pulse" />
            <p className="text-gray-400">Loading archived teams...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card border-l-4 border-l-red-500">
        <div className="flex items-center gap-3 text-red-400">
          <Archive className="h-6 w-6" />
          <div>
            <h3 className="font-semibold">Error Loading Archives</h3>
            <p className="text-sm text-gray-400 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (archives.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <Archive className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            No Archived Teams Yet
          </h3>
          <p className="text-gray-400">
            When your agent teams complete their work, they'll be archived here for reference
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-900/20 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/20 p-3 rounded-lg">
              <Archive className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Team Archive</h2>
              <p className="text-gray-400 text-sm mt-1">
                History of completed agent teams and their accomplishments
              </p>
            </div>
          </div>
          <div className="bg-purple-500/20 px-4 py-2 rounded-lg">
            <span className="text-2xl font-bold text-purple-400">{archives.length}</span>
            <span className="text-sm text-gray-400 ml-2">archived</span>
          </div>
        </div>
      </div>

      {/* Archive List */}
      {archives.map((archive, index) => (
        <div
          key={archive.filename}
          className="card border-l-4 border-l-purple-500 hover:border-l-purple-400 transition-all duration-300"
        >
          {/* Archive Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-white">{archive.overview?.split('"')[1] || 'Unknown Team'}</h3>
                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-medium rounded-full">
                  #{index + 1}
                </span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">{archive.overview}</p>
            </div>
            <button
              onClick={() => toggleExpand(archive.filename)}
              className="ml-4 p-2 hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
              aria-label={expandedArchive === archive.filename ? "Collapse details" : "Expand details"}
              aria-expanded={expandedArchive === archive.filename}
            >
              {expandedArchive === archive.filename ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>

          {/* Archive Stats */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-2 bg-gray-700/50 px-3 py-2 rounded-lg">
              <Calendar className="h-4 w-4 text-purple-400" />
              <span className="text-sm text-gray-300">
                {dayjs(archive.archivedAt).format('MMM D, YYYY')}
              </span>
              <span className="text-xs text-gray-500">
                ({dayjs(archive.archivedAt).fromNow()})
              </span>
            </div>

            {archive.members && (
              <div className="flex items-center gap-2 bg-gray-700/50 px-3 py-2 rounded-lg">
                <Users className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-gray-300">
                  {Array.isArray(archive.members) ? archive.members.length : 0} members
                </span>
              </div>
            )}

            {archive.accomplishments && (
              <div className="flex items-center gap-2 bg-gray-700/50 px-3 py-2 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-sm text-gray-300">
                  {archive.accomplishments.length} completed
                </span>
              </div>
            )}

            {archive.duration && (
              <div className="flex items-center gap-2 bg-gray-700/50 px-3 py-2 rounded-lg">
                <Clock className="h-4 w-4 text-orange-400" />
                <span className="text-sm text-gray-300">
                  {archive.duration}
                </span>
              </div>
            )}
          </div>

          {/* Quick Summary */}
          {archive.created && (
            <div className="bg-gray-800/50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-400 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-400" />
                {archive.created}
              </p>
            </div>
          )}

          {/* Expanded Details */}
          {expandedArchive === archive.filename && (
            <div className="mt-4 pt-4 border-t border-gray-700 space-y-4 animate-fadeIn">
              {/* Team Members */}
              {archive.members && archive.members.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-400" />
                    Team Members
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {archive.members.map((member, idx) => (
                      <div key={idx} className="bg-gray-800/50 rounded-lg p-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                          {member.split(' ')[0]?.[0] || '?'}
                        </div>
                        <span className="text-sm text-gray-300">{member}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Accomplishments */}
              {archive.accomplishments && archive.accomplishments.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    Key Accomplishments
                  </h4>
                  <div className="space-y-2">
                    {archive.accomplishments.map((accomplishment, idx) => (
                      <div key={idx} className="bg-gray-800/50 rounded-lg p-3 flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-300 leading-relaxed">
                          {accomplishment.replace('✅ ', '')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Details Link */}
              {selectedArchiveDetails && (
                <div className="bg-purple-900/20 rounded-lg p-4 border border-purple-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-purple-400" />
                    <h4 className="text-sm font-semibold text-purple-400">Full Archive Data</h4>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">
                    Team: {selectedArchiveDetails.teamName}
                  </p>
                  <p className="text-xs text-gray-400">
                    Total Tasks: {selectedArchiveDetails.rawData?.tasks?.length || 0}
                  </p>
                  {selectedArchiveDetails.rawData?.config && (
                    <p className="text-xs text-gray-400">
                      Configuration: {selectedArchiveDetails.rawData.config.members?.length || 0} members configured
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

ArchiveViewer.propTypes = {
  // No props needed - fetches its own data
};
