import React, { useState, useEffect } from 'react';
import { requestsAPI } from '../services/api';
import { formatDate, formatDateTime } from '../utils/helpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const RequestDetails = ({ requestId, isOpen, onClose }) => {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && requestId) {
      fetchRequestDetails();
    }
  }, [isOpen, requestId]);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      const response = await requestsAPI.getById(requestId);
      setRequest(response.data);
    } catch (error) {
      console.error('Error fetching request details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  const formatPriority = (priority) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const formatCategory = (category) => {
    return category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ');
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px]">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Loading request details...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!request) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px]">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Request not found</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Request Details</span>
            <div className="flex gap-2">
              <Badge className={getPriorityColor(request.priority)}>
                {formatPriority(request.priority)}
              </Badge>
              <Badge className={getStatusColor(request.status)}>
                {formatStatus(request.status)}
              </Badge>
            </div>
          </DialogTitle>
          <DialogDescription>
            Request ID: {request._id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Request Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{request.subject}</CardTitle>
              <CardDescription>
                <div className="flex items-center gap-4 text-sm">
                  <span>Category: <Badge variant="outline">{formatCategory(request.category)}</Badge></span>
                  <span>Created: {formatDate(request.createdAt)}</span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Description</h4>
                  <p className="text-sm leading-relaxed bg-muted p-3 rounded-md">
                    {request.description}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Status:</span>
                    <Badge className={`ml-2 ${getStatusColor(request.status)}`}>
                      {formatStatus(request.status)}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Priority:</span>
                    <Badge className={`ml-2 ${getPriorityColor(request.priority)}`}>
                      {formatPriority(request.priority)}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Created:</span>
                    <span className="ml-2">{formatDateTime(request.createdAt)}</span>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Last Updated:</span>
                    <span className="ml-2">{formatDateTime(request.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Response Section */}
          {request.adminResponse && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Admin Response
                  {request.resolvedBy && (
                    <span className="text-sm font-normal text-muted-foreground">
                      by {request.resolvedBy.name}
                    </span>
                  )}
                </CardTitle>
                {request.resolvedAt && (
                  <CardDescription>
                    Resolved on {formatDateTime(request.resolvedAt)}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
                    <p className="text-sm leading-relaxed text-blue-900">
                      {request.adminResponse}
                    </p>
                  </div>
                  
                  {request.status === 'resolved' && (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>This request has been resolved</span>
                    </div>
                  )}
                  
                  {request.status === 'rejected' && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>This request has been rejected</span>
                    </div>
                  )}
                  
                  {request.status === 'in_progress' && (
                    <div className="flex items-center gap-2 text-blue-600 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span>This request is currently being processed</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Response Yet */}
          {!request.adminResponse && request.status === 'pending' && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <div className="w-6 h-6 bg-yellow-500 rounded-full animate-pulse"></div>
                  </div>
                  <h3 className="font-medium text-yellow-800 mb-2">Awaiting Admin Response</h3>
                  <p className="text-sm text-yellow-600">
                    Your request is pending review. An admin will respond soon.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Request Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Request Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mt-1"></div>
                  <div>
                    <p className="font-medium text-sm">Request Created</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(request.createdAt)}</p>
                  </div>
                </div>
                
                {request.status !== 'pending' && (
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 bg-orange-500 rounded-full mt-1"></div>
                    <div>
                      <p className="font-medium text-sm">Status Updated to {formatStatus(request.status)}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(request.updatedAt)}</p>
                    </div>
                  </div>
                )}
                
                {request.resolvedAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full mt-1"></div>
                    <div>
                      <p className="font-medium text-sm">
                        Request {request.status === 'resolved' ? 'Resolved' : 'Closed'}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(request.resolvedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestDetails;
